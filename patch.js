(function() {
"use strict";

var hasOwnProp = Object.prototype.hasOwnProperty;
var toString = Object.prototype.toString;
var isArray = Array.isArray || function(obj) {
    return toString.call(obj) === '[object Array]';
};

// Get the exports object.
var Symmetry;
if (typeof(exports) !== 'undefined') {
    Symmetry = exports;
}
else {
    if (!window.Symmetry) window.Symmetry = {};
    Symmetry = window.Symmetry;
}

// Apply an object or array patch in-place.
Symmetry.patch = function(val, patch, options) {
    return this.patchValue(val, patch, options);
};

// Apply a patch based on its type.
Symmetry.patchValue = function(val, patch, options) {
    if (patch.t === 'o')
        return this.patchObject(val, patch, options);
    else if (patch.t === 'a')
        return this.patchArray(val, patch, options);
    else
        throw new Error("Invalid patch");
};

// Apply an object patch. (`t:'o'`)
Symmetry.patchObject = function(obj, patch, options) {
    var i, key;
    var preserve = options && options.preserve;

    var r = patch.r;
    if (r) {
        var numRemoved = r.length;
        for (i = 0; i < numRemoved; i++) {
            key = r[i];
            delete obj[key];
        }
    }

    var s = patch.s;
    if (s) {
        for (key in s) {
            if (preserve) {
                this.setPreserve(obj, key, s[key], options);
            }
            else {
                obj[key] = s[key];
            }
        }
    }

    var p = patch.p;
    if (p) {
        for (key in p) {
            obj[key] = this.patchValue(obj[key], p[key], options);
        }
    }

    return obj;
};

// Apply an array patch. (`t:'a'`)
Symmetry.patchArray = function(arr, patch, options) {
    var preserve = options && options.preserve;

    var p = patch.p;
    if (p) {
        for (var idx in p) {
            p[idx] = this.patchValue(arr[idx], p[idx], options);
        }
    }

    var s = patch.s;
    if (s) {
        var numSplices = s.length;
        for (var i = 0; i < numSplices; i++) {
            var splice = s[i];
            if (preserve) {
                var start = splice[0];
                var numPreserve = Math.min(splice[1], splice.length - 2);
                for (var j = 0; j < numPreserve; j++) {
                    this.setPreserve(arr, start + j, splice[2 + j], options);
                }

                splice = [
                    splice[0] + numPreserve,
                    splice[1] - numPreserve
                ].concat(splice.slice(2 + numPreserve));
            }
            arr.splice.apply(arr, splice);
        }
    }

    return arr;
};

// Set a property, trying to preserve an existing object or array.
Symmetry.setPreserve = function(obj, prop, val, options) {
    var cur = obj[prop];

    var valIsObject = typeof(val) === 'object' && val !== null;
    var curIsObject = typeof(cur) === 'object' && cur !== null;
    if (valIsObject && curIsObject) {
        var valIsArray = isArray(val);
        var curIsArray = isArray(cur);

        // Replace array contents.
        if (valIsArray && curIsArray) {
            this.resetArray(cur, val, options);
            return;
        }

        // Replace object contents.
        else if (!valIsArray && !curIsArray) {
            this.resetObject(cur, val, options);
            return;
        }
    }

    // Incompatible, reset the property.
    obj[prop] = val;
};

// Reset array contents.
Symmetry.resetArray = function(arr, contents, options) {
    return this.patchArray(arr, { s: [
        [0, arr.length].concat(contents)
    ] }, options);
};

// Reset object contents.
Symmetry.resetObject = function(obj, contents, options) {
    var key;

    var dontUnset = {};
    for (key in contents) {
        dontUnset[key] = true;
    }

    var clearFilter = options && options.clearFilter;
    var r = [];
    for (key in obj) {
        if (!hasOwnProp.call(obj, key)) continue;
        if (dontUnset[key] === true) continue;
        if (clearFilter && !clearFilter(obj[key], key)) continue;
        r.push(key);
    }

    return this.patchObject(obj, { r: r, s: contents }, options);
};

})();
