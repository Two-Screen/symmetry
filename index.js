var diff = require('./diff');
var patch = require('./patch');

module.exports = {
    normalizeJson: diff.normalizeJson,
    diff: diff.diff,
    diffValue: diff.diffValue,
    diffObject: diff.diffObject,
    diffArray: diff.diffArray,

    patch: patch.patch,
    patchValue: patch.patchValue,
    patchObject: patch.patchObject,
    patchArray: patch.patchArray
};
