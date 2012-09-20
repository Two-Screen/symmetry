(function() {

// Use CommonJS or look for exports on the window.
var _, Backbone, Symmetry;
if (typeof(exports) !== 'undefined') {
    _ = require('underscore');
    Backbone = require('backbone');

    Symmetry = exports;
}
else {
    _ = window._;
    Backbone = window.Backbone;

    if (!window.Symmetry) window.Symmetry = {};
    Symmetry = window.Symmetry;
}

// Producer is just another model. Attributes on the model should be set to the
// other models and collections to synchronize. The producer will then trigger
// 'message' events with JSON objects that can be sent to the consumer.
Symmetry.Producer = Backbone.Model.extend({
    initialize: function() {
        // Add listeners on the initial attributes.
        _.each(this.attributes, function(value, key) {
            this._addListeners(key, value);
        }, this);

        // Monitor changes on self.
        this.on('change', onProducerChange, this);
    },

    // Helper used to batch events. Flushes automatically on the next tick.
    _pushEvent: function(ev) {
        var batch = this._batch;
        if (!batch) {
            batch = this._batch = [];
            _.defer(this.flush, this);
        }
        batch.push(ev);
    },

    // Events during a single tick are collected, because e.g. a batch `add`
    // may fire multiple `add` events. This method can be used to manually
    // flush any collected events.
    flush: function() {
        var batch = this._batch;
        if (batch) {
            this._batch = null;
            this.trigger('message', batch);
        }
    },

    // Add change listeners to a newly set attribute.
    _addListeners: function(key, value) {
        // Set change listener on both collections and models.
        value.on('change', _.bind(onChange, this, key), this);

        // Set collection listeners.
        if (value.length !== undefined) {
            value.on('add',    _.bind(onAdd,    this, key), this);
            value.on('remove', _.bind(onRemove, this, key), this);
            value.on('reset',  _.bind(onReset,  this, key), this);
        }
    },

    // Remove change listeners on an old attribute.
    _removeListeners: function(key, value) {
        value.off('add remove reset change', null, this);
    },

    // Produces a message that contains the current state, which can be sent
    // as a 'first message' to the consumer to initialize.
    firstMessage: function() {
        return _.map(this.attributes, function(value, key) {
            var data = value.toJSON({ symmetry: true });
            if (value.length === undefined)
                return [key, 'change', data];
            else
                return [key, 'reset', data];
        });
    },

    // Stop listening and triggering message events.
    destroy: function() {
        // Remove all listeners on remaining attributes.
        _.each(this.attributes, function(value, key) {
            this._removeListeners(key, value);
        }, this);

        // Stop monitoring self.
        this.off('change', onProducerChange, this);
    }
});

// Attributes changed on the producer.
var onProducerChange = function() {
    _.each(this.changed, function(value, key) {
        // Remove listeners on the old attribute.
        var previous = this.previous(key);
        if (previous) {
            this._removeListeners(key, previous);
        }

        // Add listeners on the new attribute.
        if (value) {
            this._addListeners(key, value);
        }
    }, this);
};

// Handler for model changes.
var onChange = function(key, model) {
    var data = model.toJSON({ symmetry: true });
    this._pushEvent([key, 'change', data]);
};

// Handlers for collection changes.
var onAdd = function(key, model) {
    var data = model.toJSON({ symmetry: true });
    this._pushEvent([key, 'add', data]);
};

var onRemove = function(key, model) {
    this._pushEvent([key, 'remove', model.id]);
};

var onReset = function(key, collection) {
    var data = collection.toJSON({ symmetry: true });
    this._pushEvent([key, 'reset', data]);
};

})();
