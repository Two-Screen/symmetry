#!/usr/bin/env node

import tap, { Test } from "tap";
import Backbone from "backbone";
import { Patch, createPatch, applyPatch } from "../";

function identical(t: Test, found: any, wanted: any, descr: string): void {
  if (Object.is(found, wanted)) {
    return t.pass(descr);
  } else {
    return t.fail(descr, { found, wanted, note: "object identities differ" });
  }
}

// Verify all of a given input, output and patch.
function iop<A, B>(
  t: Test,
  input: A,
  output: B,
  patch: Patch<A | B>,
  message: string
): void {
  const createResult = createPatch<A | B>(input, output);
  t.same(createResult, patch, `${message} (verify diff)`);

  const applyResult = applyPatch(input, patch);
  if (createResult) {
    t.same(applyResult, output, `${message} (verify patch)`);
  } else {
    identical(t, applyResult, input, `${message} (verify patch)`);
  }
}

tap.test("diff with no change", (t) => {
  iop(t, null, null, null, "diff nulls");
  iop(t, true, true, null, "diff booleans");
  iop(t, 3.7, 3.7, null, "diff numbers");
  iop(t, "foo", "foo", null, "diff strings");
  iop(t, { a: 3 }, { a: 3 }, null, "diff objects");
  iop(t, [8, 9], [8, 9], null, "diff arrays");
  t.end();
});

tap.test("diff same type with nothing in common", (t) => {
  iop(t, true, false, { t: "r", v: false }, "diff booleans");
  iop(t, 3.7, 5.2, { t: "r", v: 5.2 }, "diff numbers");
  iop(t, "foo", "bar", { t: "r", v: "bar" }, "diff strings");
  iop(t, { a: 3 }, { c: 8 }, { t: "r", v: { c: 8 } }, "diff objects");
  iop(t, [1, 2], [8, 9], { t: "r", v: [8, 9] }, "diff arrays");
  t.end();
});

tap.test("diff different types, with nothing in common", (t) => {
  iop(t, null, true, { t: "r", v: true }, "null vs boolean");
  iop(t, false, 4.8, { t: "r", v: 4.8 }, "boolean vs number");
  iop(t, 3.7, "foo", { t: "r", v: "foo" }, "number vs string");
  iop(t, "bar", { d: 9 }, { t: "r", v: { d: 9 } }, "string vs object");
  iop(t, { a: 3 }, [5, 6], { t: "r", v: [5, 6] }, "object vs array");
  t.end();
});

tap.test("diff different types, with vaguely similar values", (t) => {
  iop(t, null, false, { t: "r", v: false }, "null vs false");
  iop(t, null, 0, { t: "r", v: 0 }, "null vs zero");
  iop(t, null, "", { t: "r", v: "" }, "null vs empty string");
  iop(t, false, 0, { t: "r", v: 0 }, "false vs zero");
  iop(t, false, "", { t: "r", v: "" }, "false vs empty string");
  iop(t, 0, "", { t: "r", v: "" }, "zero vs empty string");
  iop(t, 0, "0", { t: "r", v: "0" }, "zero vs string zero");
  iop(t, {}, [], { t: "r", v: [] }, "empty object vs empty array");
  iop(t, { length: 0 }, [], { t: "r", v: [] }, "fake array vs empty array");
  t.end();
});

tap.test("object diffs", (t) => {
  iop(
    t,
    { a: 3, b: 5 },
    { a: 3, b: 8 },
    { t: "o", s: { b: 8 } },
    "change an attribute"
  );
  iop(
    t,
    { a: 3, b: 5 },
    { a: 3, b: 5, c: 8 },
    { t: "o", s: { c: 8 } },
    "add an attribute"
  );
  iop(
    t,
    { a: 3, b: 5 },
    { a: 3 },
    { t: "o", r: ["b"] as any },
    "remove an attribute"
  );

  iop(
    t,
    { a: 3, b: { x: 5, y: 8 } },
    { a: 3, b: { x: 5, y: 11 } },
    { t: "o", p: { b: { t: "o", s: { y: 11 } } } },
    "partial change of an object attribute"
  );
  iop(
    t,
    { a: 3, b: { x: 5, y: 8 } },
    { a: 3, b: { x: 7, y: 11 } },
    { t: "o", s: { b: { x: 7, y: 11 } } },
    "complete change of an object attribute"
  );

  iop(
    t,
    { a: 3, b: [5, 8] },
    { a: 3, b: [5, 11] },
    { t: "o", p: { b: { t: "a", s: [[1, 1, 11]] } } },
    "partial change of an array attribute"
  );
  iop(
    t,
    { a: 3, b: [5, 8] },
    { a: 3, b: [7, 11] },
    { t: "o", s: { b: [7, 11] } },
    "complete change of an array attribute"
  );

  t.end();
});

tap.test("array diffs", (t) => {
  iop(
    t,
    [3, 5, 8],
    [4, 5, 8],
    { t: "a", s: [[0, 1, 4]] },
    "change an item at the start"
  );
  iop(
    t,
    [5, 8],
    [3, 5, 8],
    { t: "a", s: [[0, 0, 3]] },
    "insert an item at the start"
  );
  iop(
    t,
    [3, 5, 8],
    [5, 8],
    { t: "a", s: [[0, 1]] },
    "remove an item from the start"
  );

  iop(
    t,
    [3, 5, 8],
    [3, 6, 8],
    { t: "a", s: [[1, 1, 6]] },
    "change an item in the middle"
  );
  iop(
    t,
    [3, 8],
    [3, 5, 8],
    { t: "a", s: [[1, 0, 5]] },
    "insert an item in the middle"
  );
  iop(
    t,
    [3, 5, 8],
    [3, 8],
    { t: "a", s: [[1, 1]] },
    "remove an item from the middle"
  );

  iop(
    t,
    [3, 5, 8],
    [3, 5, 9],
    { t: "a", s: [[2, 1, 9]] },
    "change an item at the end"
  );
  iop(
    t,
    [3, 5],
    [3, 5, 8],
    { t: "a", s: [[2, 0, 8]] },
    "insert an item at the end"
  );
  iop(
    t,
    [3, 5, 8],
    [3, 5],
    { t: "a", s: [[2, 1]] },
    "remove an item from the end"
  );

  iop(
    t,
    [2, 3, 4],
    [1, 2, 3, 4, 5],
    {
      t: "a",
      s: [
        [3, 0, 5],
        [0, 0, 1],
      ],
    },
    "two slices"
  );
  iop(
    t,
    [1, 2, 3, 4, 5, 6, 7],
    [1, 2, 13, 14, 15, 16, 7],
    { t: "a", s: [[2, 4, 13, 14, 15, 16]] },
    "large slice"
  );

  iop(
    t,
    [3, [5, 8]],
    [3, [5, 11]],
    { t: "a", p: { 1: { t: "a", s: [[1, 1, 11]] } } },
    "partial change of an array item"
  );
  iop(
    t,
    [3, [5, 8]],
    [3, [7, 11]],
    { t: "a", s: [[1, 1, [7, 11]]] },
    "complete change of an array item"
  );

  iop(
    t,
    [3, { x: 5, y: 8 }],
    [3, { x: 5, y: 11 }],
    { t: "a", p: { 1: { t: "o", s: { y: 11 } } } },
    "partial change of an object item"
  );
  iop(
    t,
    [3, { x: 5, y: 8 }],
    [3, { x: 7, y: 11 }],
    { t: "a", s: [[1, 1, { x: 7, y: 11 }]] },
    "complete change of an object item"
  );

  iop(
    t,
    [{ x: 1, y: 1 }],
    [
      { x: 1, y: 2 },
      { x: 1, y: 3 },
      { x: 1, y: 4 },
    ],
    {
      t: "a",
      p: { 0: { t: "o", s: { y: 2 } } },
      s: [[1, 0, { x: 1, y: 3 }, { x: 1, y: 4 }]],
    },
    "all partial changes"
  );

  iop(
    t,
    [1, 2, [3, 4], 5, 6, 7, 8, [9, 10], 11, 12, 13, 14],
    [1, 2, [3, 94], 5, 96, 97, 8, [9, 910], 11, 1213, 14],
    {
      t: "a",
      p: {
        2: { t: "a", s: [[1, 1, 94]] },
        7: { t: "a", s: [[1, 1, 910]] },
      },
      s: [
        [9, 2, 1213],
        [4, 2, 96, 97],
      ],
    },
    "mixed slices and patches"
  );

  iop(
    t,
    [1, 2, 3],
    [4, 5, 6],
    { t: "r", v: [4, 5, 6] },
    "complete change of content"
  );

  t.end();
});

tap.test("undefined handling", (t) => {
  iop(t, null, undefined, null, "null vs undefined");

  iop(
    t,
    { a: 3, b: undefined },
    { a: 3 },
    null,
    "treat attribute as if non-existant (left)"
  );
  iop(
    t,
    { a: 3 },
    { a: 3, b: undefined },
    null,
    "treat attribute as if non-existant (right)"
  );

  iop(
    t,
    [3, undefined, 5],
    [3, null, 5],
    null,
    "treat array item as if null (left)"
  );
  iop(
    t,
    [3, null, 5],
    [3, undefined, 5],
    null,
    "treat array item as if null (right)"
  );

  t.end();
});

tap.test("function handling", (t) => {
  iop(t, function () {}, undefined, null, "function vs null");

  iop(
    t,
    { a: 3, b: function () {} },
    { a: 3 },
    null,
    "treat attribute as if non-existant (left)"
  );
  iop(
    t,
    { a: 3 },
    { a: 3, b: function () {} },
    null,
    "treat attribute as if non-existant (right)"
  );

  iop(
    t,
    [3, function () {}, 5],
    [3, null, 5],
    null,
    "treat array item as if null (left)"
  );
  iop(
    t,
    [3, null, 5],
    [3, function () {}, 5],
    null,
    "treat array item as if null (right)"
  );

  t.end();
});

tap.test("special number handling", (t) => {
  iop(t, NaN, null, null, "NaN vs null");
  iop(t, Infinity, null, null, "Infinity vs null");
  iop(t, -Infinity, null, null, "-Infinity vs null");
  t.end();
});

tap.test("using toJSON method", (t) => {
  let val: any;
  t.plan(6);

  val = {};
  val.toJSON = function () {
    return "foo";
  };
  iop(t, val, "foo", null, "toJSON on an object");

  val = [];
  val.toJSON = function () {
    return "foo";
  };
  iop(t, val, "foo", null, "toJSON on an array");

  val = function () {};
  val.toJSON = function () {
    return "foo";
  };
  iop(t, val, "foo", null, "toJSON on a function");

  t.end();
});

tap.test("patch is copy-on-write", (t) => {
  let patch: Patch<any>;
  let target, result;

  target = { one: { x: 3 }, two: { x: 5 } };
  patch = { t: "o", p: { one: { t: "o", s: { x: 8 } } } };
  result = applyPatch(target, patch);

  t.notSame(result, target, "should copy the root");
  t.notSame(result.one, target.one, "should copy the first object");
  t.same(result.two, target.two, "should reuse the second object");
  t.same(result.one.x, 8, "should set new properties");
  t.same(target.one.x, 3, "should not touch the original");

  target = [{ x: 3 }, { x: 5 }];
  patch = { t: "a", p: { 0: { t: "o", s: { x: 8 } } } };
  result = applyPatch(target, patch);

  t.notSame(result, target, "should copy the root");
  t.notSame(result[0], target[0], "should copy the first object");
  t.same(result[1], target[1], "should reuse the second object");
  t.same(result[0].x, 8, "should set new properties");
  t.same(target[0].x, 3, "should not touch the original");

  t.end();
});

tap.test("examples", (t) => {
  let patch: Patch<any>;
  let a, b, obj, before, after, expect, people;

  a = { x: 3, y: 5, z: 1 };
  b = { x: 3, y: 8, z: 1 };
  patch = createPatch(a, b);
  expect = { t: "o", s: { y: 8 } };
  t.same(patch, expect, "object diff");

  a = ["one", "two", "three"];
  b = ["one", "two", "two and a half"];
  patch = createPatch(a, b);
  expect = { t: "a", s: [[2, 1, "two and a half"]] };
  t.same(patch, expect, "array diff");

  obj = { x: 3, y: 5, z: 1 };
  patch = { t: "o", s: { y: 8 } };
  after = applyPatch(obj, patch);
  expect = { x: 3, y: 8, z: 1 };
  t.same(after, expect, "apply patch");

  people = new Backbone.Collection([
    { id: 1, name: "John", age: 30 },
    { id: 2, name: "Dave", age: 34 },
  ]);

  before = people.toJSON();
  people.add({ id: 3, name: "Mark", age: 27 });
  people.get(2).set("age", 35);
  patch = createPatch(before, people);
  expect = {
    t: "a",
    p: { 1: { t: "o", s: { age: 35 } } },
    s: [[2, 0, { id: 3, name: "Mark", age: 27 }]],
  };
  t.same(patch, expect, "toJSON diff");

  t.end();
});
