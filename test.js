var test = require('tape');
var Backbone = require('backbone');
var Symmetry = require('./');

// Verify all of a given input, output and patch.
function iop(t, i, o, p, message) {
    var diffOnly = typeof(p) !== 'object';

    var res = Symmetry.diff(i, o);
    t.deepEqual(res, p, message + (diffOnly ? '' : ' (verify diff)'));

    if (!diffOnly) {
        Symmetry.patch(i, p);
        t.deepEqual(i, o, message + ' (verify patch)');
    }
}

test('diff with no change', function(t) {
    iop(t, null, null,      'none', 'diff nulls');
    iop(t, true, true,      'none', 'diff booleans');
    iop(t, 3.7, 3.7,        'none', 'diff numbers');
    iop(t, 'foo', 'foo',    'none', 'diff strings');
    iop(t, {a:3}, {a:3},    'none', 'diff objects');
    iop(t, [8,9], [8,9],    'none', 'diff arrays');
    t.end();
});

test('diff same type with nothing in common', function(t) {
    iop(t, true, false,     'reset', 'diff booleans');
    iop(t, 3.7, 5.2,        'reset', 'diff numbers');
    iop(t, 'foo', 'bar',    'reset', 'diff strings');
    iop(t, {a:3}, {c:8},    'reset', 'diff objects');
    iop(t, [1,2], [8,9],    'reset', 'diff arrays');
    t.end();
});

test('diff different types, with nothing in common', function(t) {
    iop(t, null, true,      'reset', 'null vs boolean');
    iop(t, false, 4.8,      'reset', 'boolean vs number');
    iop(t, 3.7, 'foo',      'reset', 'number vs string');
    iop(t, 'bar', {d:9},    'reset', 'string vs object');
    iop(t, {a:3}, [5,6],    'reset', 'object vs array');
    t.end();
});

test('diff different types, with vaguely similar values', function(t) {
    iop(t, null, false,     'reset', 'null vs false');
    iop(t, null, 0,         'reset', 'null vs zero');
    iop(t, null, '',        'reset', 'null vs empty string');
    iop(t, false, 0,        'reset', 'false vs zero');
    iop(t, false, '',       'reset', 'false vs empty string');
    iop(t, 0, '',           'reset', 'zero vs empty string');
    iop(t, 0, '0',          'reset', 'zero vs string zero');
    iop(t, {}, [],          'reset', 'empty object vs empty array');
    iop(t, {length:0}, [],  'reset', 'fake array vs empty array');
    t.end();
});

test('object diffs', function(t) {
    iop(t,
        {a:3, b:5},
        {a:3, b:8},
        {t:'o', s:{b:8}},
        'change an attribute');
    iop(t,
        {a:3, b:5},
        {a:3, b:5, c:8},
        {t:'o', s:{c:8}},
        'add an attribute');
    iop(t,
        {a:3, b:5},
        {a:3},
        {t:'o', r:['b']},
        'remove an attribute');

    iop(t,
        {a:3, b:{x:5, y:8}},
        {a:3, b:{x:5, y:11}},
        {t:'o', p:{b:{t:'o', s:{y:11}}}},
        'partial change of an object attribute');
    iop(t,
        {a:3, b:{x:5, y:8}},
        {a:3, b:{x:7, y:11}},
        {t:'o', s:{b:{x:7, y:11}}},
        'complete change of an object attribute');

    iop(t,
        {a:3, b:[5, 8]},
        {a:3, b:[5, 11]},
        {t:'o', p:{b:{t:'a', s:[[1, 1, 11]]}}},
        'partial change of an array attribute');
    iop(t,
        {a:3, b:[5, 8]},
        {a:3, b:[7, 11]},
        {t:'o', s:{b:[7, 11]}},
        'complete change of an array attribute');

    t.end();
});

test('array diffs', function(t) {
    iop(t,
        [3, 5],
        [3, 8],
        {t:'a', s:[[1, 1, 8]]},
        'change an item');
    iop(t,
        [3, 5],
        [3, 5, 8],
        {t:'a', s:[[2, 0, 8]]},
        'append an item');
    iop(t,
        [3, 5],
        [3, 8, 5],
        {t:'a', s:[[1, 0, 8]]},
        'insert an item');
    iop(t,
        [3, 5],
        [3],
        {t:'a', s:[[1, 1]]},
        'remove an item');

    iop(t,
        [2, 3, 4],
        [1, 2, 3, 4, 5],
        {t:'a', s:[[3, 0, 5], [0, 0, 1]]},
        'two slices');
    iop(t,
        [1, 2, 3, 4, 5, 6, 7],
        [1, 2, 13, 14, 15, 16, 7],
        {t:'a', s:[[2, 4, 13, 14, 15, 16]]},
        'large slice');

    iop(t,
        [3, [5, 8]],
        [3, [5, 11]],
        {t:'a', p:{1:{t:'a', s:[[1, 1, 11]]}}},
        'partial change of an array item');
    iop(t,
        [3, [5, 8]],
        [3, [7, 11]],
        {t:'a', s:[[1, 1, [7, 11]]]},
        'complete change of an array item');

    iop(t,
        [3, {x:5, y:8}],
        [3, {x:5, y:11}],
        {t:'a', p:{1:{t:'o', s:{y:11}}}},
        'partial change of an object item');
    iop(t,
        [3, {x:5, y:8}],
        [3, {x:7, y:11}],
        {t:'a', s:[[1, 1, {x:7, y:11}]]},
        'complete change of an object item');

    iop(t,
        [1, 2, [3, 4], 5, 6, 7, 8, [9, 10], 11, 12, 13, 14],
        [1, 2, [3, 94], 5, 96, 97, 8, [9, 910], 11, 1213, 14],
        {t:'a',
            p:{
                2:{t:'a', s:[[1, 1, 94]]},
                7:{t:'a', s:[[1, 1, 910]]}
            },
            s:[
                [9, 2, 1213],
                [4, 2, 96, 97]
            ]
        },
        'mixed slices and patches');

    t.end();
});

test('undefined handling', function(t) {
    iop(t, null, undefined, 'none', 'null vs undefined');

    iop(t,
        {a:3, b:undefined},
        {a:3},
        'none',
        'treat attribute as if non-existant (left)');
    iop(t,
        {a:3},
        {a:3, b:undefined},
        'none',
        'treat attribute as if non-existant (right)');

    iop(t,
        [3, undefined, 5],
        [3, null, 5],
        'none',
        'treat array item as if null (left)');
    iop(t,
        [3, null, 5],
        [3, undefined, 5],
        'none',
        'treat array item as if null (right)');

    t.end();
});

test('function handling', function(t) {
    iop(t, function() {}, undefined, 'none', 'function vs null');

    iop(t,
        {a:3, b:function() {}},
        {a:3},
        'none',
        'treat attribute as if non-existant (left)');
    iop(t,
        {a:3},
        {a:3, b:function() {}},
        'none',
        'treat attribute as if non-existant (right)');

    iop(t,
        [3, function() {}, 5],
        [3, null, 5],
        'none',
        'treat array item as if null (left)');
    iop(t,
        [3, null, 5],
        [3, function() {}, 5],
        'none',
        'treat array item as if null (right)');

    t.end();
});

test('special number handling', function(t) {
    iop(t, NaN, null, 'none', 'NaN vs null');
    iop(t, Infinity, null, 'none', 'Infinity vs null');
    iop(t, -Infinity, null, 'none', '-Infinity vs null');
    t.end();
});

test('using toJSON method', function(t) {
    var val;
    t.plan(5);

    val = {};
    val.toJSON = function() { return 'foo'; };
    iop(t, val, 'foo', 'none', 'toJSON on an object');

    val = [];
    val.toJSON = function() { return 'foo'; };
    iop(t, val, 'foo', 'none', 'toJSON on an array');

    val = function() {};
    val.toJSON = function() { return 'foo'; };
    iop(t, val, 'foo', 'none', 'toJSON on a function');

    val.toJSON = function(options) {
        t.ok(options.symmetry, 'symmetry option set in toJSON');
        return 'foo';
    };
    Symmetry.diff(val, 'foo');

    var customOptions = {};
    val.toJSON = function(options) {
        t.equal(options, customOptions, 'custom options to toJSON');
        return 'foo';
    };
    Symmetry.diff(val, 'foo', customOptions);

    t.end();
});

test('scope', function(t) {
    var scope = Symmetry.scope();

    scope.foo = 5;
    t.deepEqual(scope.$digest(), 'reset',
        'digest after first set');

    scope.bar = 8;
    t.deepEqual(scope.$digest(), {t:'o',s:{bar:8}},
        'digest after next set');

    scope.baz = 11;
    scope.$clear();
    t.deepEqual(scope.$digest(), 'none',
        'digest after set and clear');

    t.deepEqual(scope.$digest(), 'none',
        'digest with no changes');

    scope.$test = 13;
    t.deepEqual(scope.$digest(), 'none',
        'digest after set $-property');

    t.end();
});

test('examples', function(t) {
    var a, b, obj, diff, scope, people, result, expect;

    a = { x: 3, y: 5, z: 1 };
    b = { x: 3, y: 8, z: 1 };
    result = Symmetry.diff(a, b);
    expect = { t: 'o', s: { y: 8 } };
    t.deepEqual(result, expect, 'object diff');

    a = ['one', 'two', 'three'];
    b = ['one', 'two', 'two and a half'];
    result = Symmetry.diff(a, b);
    expect = { t: 'a', s: [ [2, 1, 'two and a half'] ] };
    t.deepEqual(result, expect, 'array diff');

    obj  = { x: 3, y: 5, z: 1 };
    diff = { t: 'o', s: { y: 8 } };
    Symmetry.patch(obj, diff);
    result = obj;
    expect = { x: 3, y: 8, z: 1 };
    t.deepEqual(result, expect, 'object patch');

    scope = Symmetry.scope({ x: 3, y: 5, z: 1 });

    scope.y = 8;
    result = scope.$digest();
    expect = { t: 'o', s: { y: 8 } };
    t.deepEqual(result, expect, 'digest 1');

    scope.x = 7;
    scope.z = 2;
    result = scope.$digest();
    expect = { t: 'o', s: { x: 7, z: 2 } };
    t.deepEqual(result, expect, 'digest 2');

    people = new Backbone.Collection([
        { id: 1, name: 'John', age: 30 },
        { id: 2, name: 'Dave', age: 34 }
    ]);
    scope = Symmetry.scope({ people: people });

    scope.people.add({ id: 3, name: 'Mark', age: 27 });
    scope.people.get(2).set('age', 35);
    result = scope.$digest();
    expect = { t: 'o', p: { people: {
        t: 'a',
        p: { 1: { t: 'o', s: { age: 35 } } },
        s: [ [ 2, 0, { id: 3, name: 'Mark', age: 27 } ] ]
    } } };
    t.deepEqual(result, expect, 'toJSON');

    t.end();
});
