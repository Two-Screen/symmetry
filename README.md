## Symmetry [![Build Status](https://secure.travis-ci.org/Two-Screen/symmetry.png)](http://travis-ci.org/Two-Screen/symmetry)

Create diffs between two values:

    a = { x: 3, y: 5, z: 1 };
    b = { x: 3, y: 8, z: 1 };
    Symmetry.diff(a, b)  # => { t: 'o', s: { y: 8 } }

    a = ['one', 'two', 'three'];
    b = ['one', 'two', 'two and a half'];
    Symmetry.diff(a, b)  # => { t: 'a', s: [ [2, 1, 'two and a half'] ] }

And apply them somewhere else:

    obj  = { x: 3, y: 5, z: 1 };
    diff = { t: 'o', s: { y: 8 } };
    Symmetry.patch(obj, diff);
    obj  # => { x: 3, y: 8, z: 1 }

Use a scope to create a chain of diffs:

    scope = Symmetry.scope({ x: 3, y: 5, z: 1 });

    scope.y = 8;
    scope.$digest();  # => { t: 'o', s: { y: 8 } }

    scope.x = 7;
    scope.z = 2;
    scope.$digest();  # => { t: 'o', s: { x: 7, z: 2 } }

Can diff anything that can be represented as JSON:

    people = new Backbone.Collection([
        { id: 1, name: 'John', age: 30 },
        { id: 2, name: 'Dave', age: 34 }
    ]);
    scope = Symmetry.scope({ people: people });

    scope.people.add({ id: 3, name: 'Mark', age: 27 });
    scope.people.get(2).set('age', 35);
    scope.$digest();  # => { t: 'o', p: { people: { t: 'a', /* ... */ } } }

### Installing

In node.js, install using NPM:

    npm install symmetry

In the browser, simply include `diff.js` or `patch.js`.

### Hacking the code

    git clone https://github.com/Two-Screen/symmetry.git
    cd symmetry
    npm install
    npm test
