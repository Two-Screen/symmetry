#!/usr/bin/env node

import Benchmark, { Event, Suite } from "benchmark";
import * as Symmetry from "../";

declare let x: any;
declare let y: any;
(<any>global).Symmetry = Symmetry;

const suite = new Suite();

function setup() {
  // Some slightly complicated differing values.
  const dummies = () => {
    return {
      v1: { a: 1, b: { x: 2, y: 3 }, c: [4, 5] },
      v2: { a: 2, b: { x: 2, y: 3 }, c: [4, 5] },
      v3: { a: 2, b: { x: 3, y: 4 }, c: [4, 5] },
      v4: { a: 2, b: { x: 3, y: 4 }, c: [5, 6] },
      v5: { a: 2, b: { x: 2, y: 3 }, c: [5, 6] },
      v6: { a: 1, b: { x: 3, y: 4 }, c: [4, 5] },
      v7: { a: 1, b: { x: 3, y: 4 }, c: [5, 6] },
      v8: { a: 1, b: { x: 2, y: 3 }, c: [5, 6] },
    };
  };

  // Two copies to trigger full comparison.
  x = dummies();
  y = dummies();
}

function onComplete(event: Event): void {
  // Format result somewhat like jsperf.
  const bench = <Benchmark>event.currentTarget;
  if (bench.error) {
    console.error(bench.error);
    process.exit(1);
  } else {
    const hz = Benchmark.formatNumber(~~bench.hz);
    console.log(
      `${(<any>bench).name}:`.padEnd(30) +
        " " +
        hz.padStart(10) +
        " ops/sec " +
        "(± " +
        bench.stats.rme.toFixed(2) +
        " %)",
    );
  }
}

function add(name: string, fn: () => void): void {
  suite.add(name, fn, { setup, onComplete });
}

// Some patches and sets, on simple object.
add("various object changes", () => {
  Symmetry.createObjectPatch(
    { a: x.v1, b: x.v2, c: x.v3, d: x.v4, e: x.v5, f: x.v6 },
    { a: y.v1, b: y.v7, c: y.v3, d: y.v8, e: y.v7, f: y.v6 },
  );
});

// Some patches and slices, on simple array.
add("various array changes", () => {
  Symmetry.createArrayPatch(
    [x.v1, x.v2, x.v3, x.v4, x.v5, x.v6],
    [y.v1, y.v7, y.v3, y.v8, y.v7, y.v7],
  );
});

// These should be fast, as they should short circuit.
add("array push", () => {
  Symmetry.createArrayPatch(
    [x.v1, x.v2, x.v3, x.v4, x.v5, x.v6],
    [y.v1, y.v2, y.v3, y.v4, y.v5, y.v6, y.v7],
  );
});
add("array pop", () => {
  Symmetry.createArrayPatch(
    [x.v1, x.v2, x.v3, x.v4, x.v5, x.v6],
    [y.v1, y.v2, y.v3, y.v4, y.v5],
  );
});
add("array shift", () => {
  Symmetry.createArrayPatch(
    [x.v1, x.v2, x.v3, x.v4, x.v5, x.v6],
    [y.v2, y.v3, y.v4, y.v5, y.v6],
  );
});
add("array unshift", () => {
  Symmetry.createArrayPatch(
    [x.v1, x.v2, x.v3, x.v4, x.v5, x.v6],
    [y.v8, y.v1, y.v2, y.v3, y.v4, y.v5, y.v6],
  );
});

// Add one to front and truncate.
add("array unshift & push", () => {
  Symmetry.createArrayPatch(
    [x.v7, x.v6, x.v5, x.v4, x.v3, x.v2, x.v1],
    [y.v8, y.v7, y.v6, y.v5, y.v4, y.v3, y.v2],
  );
});

suite.run();
