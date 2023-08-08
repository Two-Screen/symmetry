## Symmetry

Create diffs between two values:

```js
a = { x: 3, y: 5, z: 1 };
b = { x: 3, y: 8, z: 1 };
patch = createPatch(a, b);
// => { t: 'o', s: { y: 8 } }

a = ["one", "two", "three"];
b = ["one", "two", "two and a half"];
patch = createPatch(a, b);
// => { t: 'a', s: [ [2, 1, 'two and a half'] ] }
```

And apply them somewhere else:

```js
obj = { x: 3, y: 5, z: 1 };
patch = { t: "o", s: { y: 8 } };
after = applyPatch(obj, patch);
// => { x: 3, y: 8, z: 1 }
```

Will diff anything with a `toJSON()` method.

```js
people = new Backbone.Collection([
  { id: 1, name: "John", age: 30 },
  { id: 2, name: "Dave", age: 34 },
]);

before = people.toJSON();
people.add({ id: 3, name: "Mark", age: 27 });
people.get(2).set("age", 35);
patch = createPatch(before, people);
// => {
//   t: "a",
//   p: { 1: { t: "o", s: { age: 35 } } },
//   s: [[2, 0, { id: 3, name: "Mark", age: 27 }]]
// }
```

[MIT-licensed](http://en.wikipedia.org/wiki/MIT_license)

### Installing

Install using NPM:

```bash
npm install symmetry
```

### Patch format

Patches are one of three types of object, identified by the `t` field.

Object patches have `"t": "o"`, and additional fields:

- `r` for 'remove', with a list of target properties to remove.
- `s` for 'set', with an object mapping target properties to values.
- `p` for 'patch', with an object mapping target properties to subpatches.

Array patches have `"t": "a"`, and additional fields:

- `p` for 'patch', with an object mapping target indices to subpatches.
- `s` for 'splice', with a list of argument lists for the array `splice` method
  to apply in order. Must be applied after `p`.

Reset patches have `"t": "r"`, and additional fields:

- `v` for 'value', containing the new value in full.

Reset patches occur when two values differ enough to make a patch not useful.

Finally, a patch may also be `null` to indicate no change.

### Hacking the code

```bash
git clone https://github.com/Two-Screen/symmetry.git
cd symmetry
npm install
npm test
```
