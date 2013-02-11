(function() {
"use strict";
/*global require, exports, window */

// Get the exports object.
var Symmetry, diff;
if (typeof(exports) !== 'undefined') {
    Symmetry = exports;
    diff = require('./diff');
}
else {
    if (!window.Symmetry) window.Symmetry = {};
    Symmetry = diff = window.Symmetry;
}

// Create a deep clone of normalized JSON values.
// Optionally takes a `filter(value, key)` function.
var cloneJson = Symmetry.cloneJson = function(val, options) {
    if (!val || typeof(val) !== 'object')
        return val;

    var clone;

    if (Array.isArray(val)) {
        var length = val.length;

        clone = new Array(length);
        for (var i = 0; i < length; i++) {
            var itemVal = diff.normalizeJson(val[i]);
            if (itemVal === undefined)
                clone[i] = null;
            else
                clone[i] = cloneJson(attrVal);
        }
    }
    else {
        var filter = options && options.filter;

        clone = {};
        for (var key in val) {
            var attrVal = diff.normalizeJson(val[key]);
            if (filter)
                attrVal = filter(attrVal, key);
            if (attrVal !== undefined)
                clone[key] = cloneJson(attrVal);
        }
    }

    return clone;
};

// The default filter for scope object.
// Treats all attributes starting with `$` as undefined.
var scopeKeyRegexp = /^\$/;
var scopeFilter = Symmetry.scopeFilter = function(val, key) {
    if (scopeKeyRegexp.test(key))
        return undefined;
    else
        return val;
};

// An object that tracks modifications to itself. After making changes,
// call `$digest` to get a patch, or `$clear` to discard them.
var Scope = Symmetry.scope = function(options) {
    if (!(this instanceof Scope))
        return new Scope(options);
    if (!options)
        options = {};
    if (!options.filter)
        options.filter = scopeFilter;

    this.$last = {};
    this.$options = options;
};

// Create a digest of all changes.
Scope.prototype.$digest = function() {
    var current = cloneJson(this, this.$options);
    var result = diff.diffObject(this.$last, current);
    this.$last = current;
    return result;
};

// Discard all changes.
Scope.prototype.$clear = function() {
    this.$last = cloneJson(this, this.$options);
};

})();
