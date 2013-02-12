var diff = require('./diff');
var patch = require('./patch');
var scope = require('./scope');

module.exports = {
    normalizeJson: diff.normalizeJson,
    diff: diff.diff,
    diffValue: diff.diffValue,
    diffObject: diff.diffObject,
    diffArray: diff.diffArray,

    patch: patch.patch,
    patchValue: patch.patchValue,
    patchObject: patch.patchObject,
    patchArray: patch.patchArray,

    cloneJson: scope.cloneJson,
    cloneJsonValue: scope.cloneJsonValue,
    cloneJsonObject: scope.cloneJsonObject,
    cloneJsonArray: scope.cloneJsonArray,
    scopeFilter: scope.scopeFilter,
    scope: scope.scope
};
