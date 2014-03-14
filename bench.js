#!/usr/bin/env node

var Benchmark = require('benchmark');
var Symmetry = require('./');

global.Symmetry = require('./');

function padLeft(len, str) {
    while (str.length < len)
        str = ' ' + str;
    return str;
}
function padRight(len, str) {
    while (str.length < len)
        str = str + ' ';
    return str;
}

// Benchmark helper function.
function bench(name, fn) {
    var b = new Benchmark(name, {
        setup: setup,
        fn: fn,
        onComplete: onComplete
    });
    b.run();
}

function setup() {
    // Some slightly complicated differing values.
    function dummies() {
        var o = {};
        o.v1 = {a:1, b:{x:2, y:3}, c:[4, 5]};
        o.v2 = {a:2, b:{x:2, y:3}, c:[4, 5]};
        o.v3 = {a:2, b:{x:3, y:4}, c:[4, 5]};
        o.v4 = {a:2, b:{x:3, y:4}, c:[5, 6]};
        o.v5 = {a:2, b:{x:2, y:3}, c:[5, 6]};
        o.v6 = {a:1, b:{x:3, y:4}, c:[4, 5]};
        o.v7 = {a:1, b:{x:3, y:4}, c:[5, 6]};
        o.v8 = {a:1, b:{x:2, y:3}, c:[5, 6]};
        return o;
    }

    // Two copies to trigger full comparison.
    var x = dummies();
    var y = dummies();
}

function onComplete() {
    // Somewhat like jsperf.
    var hz = Benchmark.formatNumber(this.hz.toFixed(hz < 100 ? 2 : 0));
    console.log(
        padRight(30, this.name + ':') + ' ' +
        padLeft(10, hz) + ' ops/sec ' +
        '(± ' + this.stats.rme.toFixed(2) + ' %)'
    );
}


// Some patches and sets, on simple object.
bench('various object changes', function() {
    Symmetry.diff(
        {a:x.v1, b:x.v2, c:x.v3, d:x.v4, e:x.v5, f:x.v6},
        {a:y.v1, b:y.v7, c:y.v3, d:y.v8, e:y.v7, f:y.v6}
    );
});

// Some patches and slices, on simple array.
bench('various array changes', function() {
    Symmetry.diff(
        [x.v1, x.v2, x.v3, x.v4, x.v5, x.v6],
        [y.v1, y.v7, y.v3, y.v8, y.v7, y.v7]
    );
});

// These should be fast, as they should short circuit.
bench('array push', function() {
    Symmetry.diff(
        [x.v1, x.v2, x.v3, x.v4, x.v5, x.v6],
        [y.v1, y.v2, y.v3, y.v4, y.v5, y.v6, y.v7]
    );
});
bench('array pop', function() {
    Symmetry.diff(
        [x.v1, x.v2, x.v3, x.v4, x.v5, x.v6],
        [y.v1, y.v2, y.v3, y.v4, y.v5]
    );
});
bench('array shift', function() {
    Symmetry.diff(
        [x.v1, x.v2, x.v3, x.v4, x.v5, x.v6],
        [y.v2, y.v3, y.v4, y.v5, y.v6]
    );
});
bench('array unshift', function() {
    Symmetry.diff(
        [x.v1, x.v2, x.v3, x.v4, x.v5, x.v6],
        [y.v8, y.v1, y.v2, y.v3, y.v4, y.v5, y.v6]
    );
});

// Add one to front and truncate.
bench('array unshift & push', function() {
    Symmetry.diff(
        [x.v7, x.v6, x.v5, x.v4, x.v3, x.v2, x.v1],
        [y.v8, y.v7, y.v6, y.v5, y.v4, y.v3, y.v2]
    );
});
