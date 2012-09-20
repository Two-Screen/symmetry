## Symmetry.js

Dirt simple library to sync remote [Backbone.js] models and collections. Leaves
the transport to you, but in return works almost anywhere (browser / node.js).

 [Backbone.js]: http://documentcloud.github.com/backbone/

### Installing

On node.js, install using NPM:

    npm install symmetry

On the browser, simply include `producer.js` or `consumer.js`.

### Usage

A producer monitors models and collections, and creates messages. The producer
is a model itself, whose attributes should be the other models and collections
you want to have sync'd.

    // We're going to sync these.
    var foo = new Backbone.Model();
    var bar = new Backbone.Collection();

    // Across this connection.
    var conn = /* use your imagination */;

    // The producer and consumer must have matching attribute names.
    var producer = new Symmetry.Producer({
        foo: foo,
        bar: bar
    });

    // Send messages.
    producer.on('message', function(message) {
        conn.send(JSON.stringify(message));
    });

    // Send the initial state, if necessary.
    conn.send(JSON.stringify(producer.firstMessage());

A consumer takes messages, and updates models and collections.

    // We're going to sync these.
    var foo = new Backbone.Model();
    var bar = new Backbone.Collection();

    // Across this connection.
    var conn = /* use your imagination */;

    // The producer and consumer must have matching attribute names.
    var consumer = new Symmetry.Consumer({
        foo: foo,
        bar: bar
    });

    // Dispatch messages.
    conn.on('message', function(data) {
        consumer.message(JSON.parse(data));
    });

### Notes

 - The producer monitors events, so silent updates are ignored, (because they
   never trigger an event.)

 - The producer uses `toJSON` and sets the option `symmetry: true`. This allows
   filtering data before the consumer sees it, if desired.

 - There is no validation; both producer and consumer blindly trust input.

 - Assumes a message transport (e.g. WebSockets). When using stream sockets
   like TCP, don't forget do provide your own framing.

### Hacking the code

    git clone https://github.com/Two-Screen/symmetry.git
    cd symmetry
    npm install
    npm test
