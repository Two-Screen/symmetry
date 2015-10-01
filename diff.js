(function() {
"use strict";

var toString = Object.prototype.toString;
var isArray = Array.isArray || function(obj) {
    return toString.call(obj) === '[object Array]';
};

function Dummy() {}
function inherit(parent) {
    Dummy.prototype = parent;
    var obj = new Dummy();
    obj.parent = parent;
    return obj;
}

// Get the exports object.
var Symmetry;
if (typeof(exports) !== 'undefined') {
    Symmetry = exports;
}
else {
    if (!window.Symmetry) window.Symmetry = {};
    Symmetry = window.Symmetry;
}

// Fix up some JavaScript types and values that are not JSON. This may still
// return undefined to signal the value is normally not serialized at all.
Symmetry.normalizeJson = function(val, options) {
    if (val instanceof Object) {
        // Call toJSON method.
        if (typeof(val.toJSON) === 'function')
            val = val.toJSON(options || { symmetry: true });
        // Treat functions as undefined.
        if (typeof(val) === 'function')
            val = undefined;
    }
    else {
        // Special numbers serialize to null.
        if (typeof(val) === 'number') {
            if (val !== val || val === Infinity || val === -Infinity)
                val = null;
        }
    }
    return val;
};

// Compare any two values and return `none`, `reset` or a patch.
Symmetry.diff = function(left, right, options) {
    left  = this.normalizeJson(left, options);
    right = this.normalizeJson(right, options);
    return this.diffValue(left, right, options);
};

// Compare any two values. Values passed in should already be normalized.
Symmetry.diffValue = function(left, right, options) {
    // Treat undefined as null.
    if (left  === undefined) left  = null;
    if (right === undefined) right = null;

    // Identical, don't even need to descend.
    if (left === right)
        return 'none';

    var leftIsObject  = typeof(left)  === 'object' && left  !== null;
    var rightIsObject = typeof(right) === 'object' && right !== null;
    if (leftIsObject && rightIsObject) {
        var leftIsArray  = isArray(left);
        var rightIsArray = isArray(right);

        // Descend into two arrays.
        if (leftIsArray && rightIsArray)
            return this.diffArray(left, right, options);

        // Descend into two regular objects.
        else if (!leftIsArray && !rightIsArray)
            return this.diffObject(left, right, options);
    }

    // Reset everything else.
    return 'reset';
};

// Compare two objects. Patches generated have:
//  - `t` is always 'o'.
//  - `r` is a set of keys removed.
//  - `s` is a map of keys to new values.
//  - `p` is a map of keys to more specific patches.
Symmetry.diffObject = function(left, right, options) {
    var r = [], s = {}, p = {};
    var key, valLeft, valRight;
    var numAttrs = 0, numSets = 0, numPatches = 0;

    // Walk existing properties.
    for (key in left) {
        valLeft = this.normalizeJson(left[key], options);
        if (valLeft === undefined)
            continue;

        numAttrs += 1;
        valRight = this.normalizeJson(right[key], options);

        // Attribute was removed.
        if (valRight === undefined) {
            r.push(key);
            continue;
        }

        // Diff and merge the resulting patch.
        var patch = this.diffValue(valLeft, valRight, options);
        if (patch === 'reset') {
            s[key] = valRight;
            numSets += 1;
        }
        else if (patch !== 'none') {
            p[key] = patch;
            numPatches += 1;
        }
    }

    // No partial changes, tell parent we should be reset.
    if (numAttrs && r.length + numSets === numAttrs)
        return 'reset';

    // Find new properties.
    for (key in right) {
        valRight = this.normalizeJson(right[key], options);
        if (valRight === undefined)
            continue;

        // Attributes was added to an empty object.
        if (numAttrs === 0)
            return 'reset';

        // Attribute was added.
        valLeft = this.normalizeJson(left[key], options);
        if (valLeft === undefined) {
            s[key] = valRight;
            numSets += 1;
        }
    }

    // Build the patch object.
    var res = {t:'o'};
    if (r.length)   res.r = r;
    if (numSets)    res.s = s;
    if (numPatches) res.p = p;
    if (!res.r && !res.s && !res.p)
        return 'none';
    else
        return res;
};

// Compare two arrays. Patches generated have:
//  - `t` is always 'a'.
//  - `p` is a map of indices to more specific patches.
//    These reference original indices, and should be applied first.
//  - `s` is a list of splices, each an array of `splice()` arguments.
//    These are in reverse order, so they can be applied as specified.
Symmetry.diffArray = function(left, right, options) {
    var lenLeft = left.length;
    var lenRight = right.length;
    var valLeft, valRight, idx, slice;

    // Reduce the problem by trimming exact matches at the start.
    var start, firstDiff;
    for (start = 0; start < lenLeft && start < lenRight; start += 1) {
        valLeft  = this.normalizeJson(left[start], options);
        valRight = this.normalizeJson(right[start], options);
        firstDiff = this.diffValue(valLeft, valRight, options);
        if (firstDiff !== 'none')
            break;
    }

    // Short-circuit for exact matches, pushes and pops.
    if (start === lenLeft) {
        if (start === lenRight)
            return 'none';

        slice = new Array(2 + lenRight - start);
        slice[0] = lenLeft;
        slice[1] = 0;
        for (idx = 2; start < lenRight; start += 1, idx += 1) {
            slice[idx] = this.normalizeJson(right[start], options);
        }
        return {t:'a', s:[slice]};
    }
    else if (start === lenRight) {
        slice = [start, lenLeft - start];
        return {t:'a', s:[slice]};
    }

    // Reduce further by trimming exact matches at the end.
    var endLeft = lenLeft - 1;
    var endRight = lenRight - 1;
    var lastDiff;
    while (endLeft >= start && endRight >= start) {
        valLeft  = this.normalizeJson(left[endLeft], options);
        valRight = this.normalizeJson(right[endRight], options);
        lastDiff = this.diffValue(valLeft, valRight, options);
        if (lastDiff !== 'none')
            break;
        endLeft -= 1;
        endRight -= 1;
    }

    // Short-circuit for a single block of inserts or removes.
    if (endLeft < start) {
        slice = new Array(2 + endRight - start + 1);
        slice[0] = start;
        slice[1] = 0;
        for (idx = 2; start <= endRight; start += 1, idx += 1) {
            slice[idx] = this.normalizeJson(right[start], options);
        }
        return {t:'a', s:[slice]};
    }
    else if (endRight < start) {
        slice = [start, endLeft - start + 1];
        return {t:'a', s:[slice]};
    }

    // For the remainder, do a full search. This implements the greedy
    // algorithm described in Myers' paper: http://xmailserver.org/diff2.pdf
    // FIXME: Look into the refinements described in the paper.
    var width = endLeft - start + 1;
    var height = endRight - start + 1;
    var size = width * height;
    var diag = width + 1;

    var diffs = new Array(size);
    diffs[0] = firstDiff;
    diffs[size - 1] = lastDiff;

    var v, d, k, x, y, diff;
    v = { 1: 0 };  // sentinel
    outer: for (d = 0; d < size; d++) {
        v = inherit(v);

        for (k = -d; k <= d; k += 2) {
            // Decide on direction.
            if (k === -d || (k !== d && v[k-1] < v[k+1]))
                x = v[k+1];
            else
                x = v[k-1] + 1;
            y = x - k;

            // Exhaust diagonal until we hit a reset.
            idx = y * width + x;
            while (idx < size) {
                diff = diffs[idx];
                if (!diff) {
                    valLeft  = this.normalizeJson(left[start + x], options);
                    valRight = this.normalizeJson(right[start + y], options);
                    diff = diffs[idx] = this.diffValue(valLeft, valRight, options);
                }

                if (diff === 'reset')
                    break;

                x++; y++; idx += diag;
            }

            v[k] = x;

            if (x >= width && y >= height)
                break outer;
        }
    }

    // Collect patches and splices.
    var havePatches = false;
    var p = {};
    var s = [];

    if (d === size) {
        // If we splice the entire array, return a reset.
        if (start === 0 && width === lenLeft)
            return 'reset';
        // If we have no diagonals, we can optimize.
        else
            s.push([start, width].concat(right.slice(start, endRight + 1)));
    }
    else {
        k = width - height;
        var current = [null, null];
        while (d-- >= 0) {
            // Decide on direction.
            var isVert = v[k-1] === undefined ||
                (v[k+1] !== undefined && v[k-1] < v[k+1]);
            k = isVert ? k+1 : k-1;
            x = v[k];
            y = x - k;

            // Append the move to the current splice, or create a new one.
            // The `y !== -1` check skips the sentinel.
            var idxLeft = start + x;
            if (isVert) {  // element added
                if (y !== -1) {
                    if (current[0] === idxLeft) {
                        valRight = this.normalizeJson(right[start + y], options);
                        current.splice(2, 0, valRight);
                    }
                    else {
                        s.push(current = [idxLeft, 0, right[start + y]]);
                    }
                }
                y++;
            }
            else {  // element removed
                if (y !== -1) {
                    if (current[0] === idxLeft + 1) {
                        current[0] -= 1; current[1] += 1;
                    }
                    else {
                        s.push(current = [idxLeft, 1]);
                    }
                }
                x++;
            }

            // Exhaust diagonal until we hit a reset.
            idx = y * width + x;
            while (idx < size) {
                diff = diffs[idx];
                if (diff === 'reset')
                    break;
                if (diff !== 'none') {
                    p[start + x] = diff;
                    havePatches = true;
                }

                x++; y++; idx += diag;
            }

            v = v.parent;
        }
    }

    // Build the patch object.
    var res = {t:'a'};
    if (havePatches) res.p = p;
    if (s.length)    res.s = s;
    return res;
};

})();
