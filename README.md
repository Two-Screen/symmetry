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

### Hacking the code

```bash
git clone https://github.com/Two-Screen/symmetry.git
cd symmetry
npm install
npm test
```
