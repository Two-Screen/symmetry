var test = require('tap').test;

var _ = require('underscore');
var Backbone = require('backbone');
var Symmetry = require('./');

test('basic usage', function(t) {
    t.plan(7);

    // Producer and its models.
    var P_foo = new Backbone.Model({ id: 1, a: 3 });
    var P_bar = new Backbone.Collection([
        { id: 2, a: 5 },
        { id: 3, a: 8 }
    ]);
    var producer = new Symmetry.Producer({
        foo: P_foo,
        bar: P_bar
    });

    // Consumer and its models.
    var C_foo = new Backbone.Model();
    var C_bar = new Backbone.Collection();
    var consumer = new Symmetry.Consumer({
        foo: C_foo,
        bar: C_bar
    });

    // Link the two together. `lastMessage` is used as extra info.
    var lastMessage = null;
    producer.on('message', function(message) {
        lastMessage = message;
        consumer.message(message);
    });

    // Helper that checks if synchronisation worked.
    var checkSync = function(message) {
        producer.flush();

        var a = {};
        _.each(consumer.attributes, function(value, key) {
            a[key] = value.toJSON();
        });

        var b = {};
        _.each(producer.attributes, function(value, key) {
            b[key] = value.toJSON();
        });

        t.same(a, b, message, { lastMessage: lastMessage });
    };

    // Send initial state.
    consumer.message(producer.firstMessage());
    checkSync("sync initial state");

    // Check basic Backbone.js operations.
    P_foo.set({ b: 13 });
    checkSync("sync model change");
    P_bar.get(2).set({ b: 15 });
    checkSync("sync collection change");
    P_bar.remove(3);
    checkSync("sync collection remove");
    P_bar.add({ id: 4, a: 7 });
    checkSync("sync collection add");
    P_bar.reset({ id: 5, a: 9 });
    checkSync("sync collection reset");

    // Check if multiple events are properly batched.
    P_bar.add([
        { id: 6, a: 1 },
        { id: 7, a: 8 }
    ]);
    producer.flush();
    t.equals(
        lastMessage.length, 2,
        "event batching", { lastMessage: lastMessage }
    );
});

test('automatic flush', { timeout: 1000 }, function(t) {
    t.plan(1);

    var model = new Backbone.Model({ id: 1, a: 3});
    var producer = new Symmetry.Producer({ foobar: model });

    producer.on('message', function(message) {
        t.pass('should automatically flush');
    });
    model.set({ a: 5 });
});
