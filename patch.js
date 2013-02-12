(function() {
"use strict";
/*global exports, window */

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
Symmetry.patch = function(val, patch) {
    this.patchValue(val, patch);
};

// Apply a patch based on its type.
Symmetry.patchValue = function(val, patch) {
    if (patch.t === 'o')
        this.patchObject(val, patch);
    else if (patch.t === 'a')
        this.patchArray(val, patch);
    else
        throw new Error("Invalid patch");
};

// Apply an object patch. (`t:'o'`)
Symmetry.patchObject = function(obj, patch) {
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
            this.patchValue(obj[key], p[key]);
        }
    }
};

// Apply an array patch. (`t:'a'`)
Symmetry.patchArray = function(arr, patch) {
    var i, idx;

    var p = patch.p;
    if (p) {
        for (idx in p) {
            this.patchValue(arr[idx], p[idx]);
        }
    }

    var s = patch.s;
    if (s) {
        var numSplices = s.length;
        for (i = 0; i < numSplices; i++) {
            arr.splice.apply(arr, s[i]);
        }
    }
};

})();
