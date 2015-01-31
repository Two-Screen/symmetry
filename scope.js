(function() {
"use strict";
/*global require, module, window */

var toString = Object.prototype.toString;
var isArray = Array.isArray || function(obj) {
    return toString.call(obj) === '[object Array]';
};

// Get the exports object.
var Symmetry;
if (typeof(module) !== 'undefined') {
    Symmetry = module.exports = Object.create(require('./diff'));
}
else {
    if (!window.Symmetry) window.Symmetry = {};
    Symmetry = window.Symmetry;
}

// Create a deep clone of normalized JSON values.
// Optionally takes a `filter(value, key)` function.
Symmetry.cloneJson = function(val, options) {
    val = this.normalizeJson(val, options);
    return this.cloneJsonValue(val, options);
};

// Create a deep clone of any value.
Symmetry.cloneJsonValue = function(val, options) {
    if (!val || typeof(val) !== 'object')
        return val;
    else if (isArray(val))
        return this.cloneJsonArray(val, options);
    else
        return this.cloneJsonObject(val, options);
};

// Create a deep clone of an object.
Symmetry.cloneJsonObject = function(obj, options) {
    var clone = {};
    var keys = Object.keys(obj);
    var filter = options && options.filter;
    for (var i in keys) {
        var key = keys[i];
        var attrVal = this.normalizeJson(obj[key], options);
        if (filter)
            attrVal = filter(attrVal, key);
        if (attrVal !== undefined)
            clone[key] = this.cloneJsonValue(attrVal, options);
    }
    return clone;
};

// Create a deep clone of an array.
Symmetry.cloneJsonArray = function(arr, options) {
    var length = arr.length;
    var clone = new Array(length);
    for (var i = 0; i < length; i++) {
        var itemVal = this.normalizeJson(arr[i], options);
        if (itemVal === undefined)
            clone[i] = null;
        else
            clone[i] = this.cloneJsonValue(itemVal, options);
    }
    return clone;
};

// The default filter for scope object.
// Treats all attributes starting with `$` as undefined.
var scopeFilter = Symmetry.scopeFilter = function(val, key) {
    if (key.charAt(0) === '$')
        return undefined;
    else
        return val;
};

// An object that tracks modifications to itself. After making changes,
// call `$digest` to get a patch, or `$clear` to discard them.
var Scope = Symmetry.scope = function(init, options) {
    if (!(this instanceof Scope))
        return new Scope(init, options);

    if (!options)
        options = { symmetry: true };
    if (!options.filter)
        options.filter = scopeFilter;
    this.$options = options;

    if (init) {
        for (var key in init) {
            var val = init[key];
            if (val !== undefined)
                this[key] = val;
        }
    }

    this.$clear();
};

// Create a digest of all changes.
Scope.prototype.$digest = function() {
    var current = Symmetry.cloneJson(this, this.$options);
    var result = Symmetry.diffObject(this.$last, current, this.$options);
    this.$last = current;
    return result;
};

// Discard all changes.
Scope.prototype.$clear = function() {
    this.$last = Symmetry.cloneJson(this, this.$options);
};

})();
