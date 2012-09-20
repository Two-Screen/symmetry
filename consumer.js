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

// Consumer is just another model. Attributes on the model should be set to the
// other models and collections to synchronize. The consumer will dispatch
// messages from a producer to keep these up to date.
Symmetry.Consumer = Backbone.Model.extend({
    // Dispatch a message.
    message: function(message) {
        _.each(message, function(ev) {
            // Unpack event.
            var key  = ev[0];
            var name = ev[1];
            var arg  = ev[2];

            // Look up the key.
            var value = this.get(key);

            // Handle the event.
            switch (name) {
                case 'change':
                    // Look up the model if this is a collection.
                    if (value.length !== undefined) {
                        var idAttribute = value.model.prototype.idAttribute;
                        value = value.get(arg[idAttribute]);
                    }

                    value.set(arg, { symmetry: true });
                    break;

                case 'add':
                    value.add(arg, { symmetry: true });
                    break;

                case 'remove':
                    value.remove(arg, { symmetry: true });
                    break;

                case 'reset':
                    value.reset(arg, { symmetry: true });
                    break;
            }
        }, this);
    }
});

})();
