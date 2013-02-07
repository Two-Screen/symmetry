(function() {
"use strict";
/*global require, exports, window */

var Symmetry;
if (typeof(exports) !== 'undefined') {
    Symmetry = exports;
}
else {
    if (!window.Symmetry) window.Symmetry = {};
    Symmetry = window.Symmetry;
}

Symmetry.patch = patchValue;

// Apply a patch to an object in-place.
function patchValue(val, patch) {
    if (patch.t === 'o')
        patchObject(val, patch);
    else if (patch.t === 'a')
        patchArray(val, patch);
    else
        throw new Error("Invalid patch");
}

// Accepts patches with `t:'o'`.
function patchObject(obj, patch) {
    var i, key;

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
            obj[key] = s[key];
        }
    }

    var p = patch.p;
    if (p) {
        for (key in p) {
            patchValue(obj[key], p[key]);
        }
    }
}

// Accepts patches with `t:'a'`.
function patchArray(arr, patch) {
    var i, idx;

    var p = patch.p;
    if (p) {
        for (idx in p) {
            patchValue(arr[idx], p[idx]);
        }
    }

    var s = patch.s;
    if (s) {
        var numSplices = s.length;
        for (i = 0; i < numSplices; i++) {
            arr.splice.apply(arr, s[i]);
        }
    }
}

})();
