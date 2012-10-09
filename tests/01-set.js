var setup = require('./setup'),
    assert = require('assert');

setup.plan(2); // exit at second call to setup.end()

setup(function(err, cb) {
    assert(!err, "setup failure");

    cb.on("error", function (message) {
        console.log("ERROR: [" + message + "]");
        process.exit(1);
    });

    // test cas updates
    var testkey = "01-set.js"
    cb.set(testkey, "bar", function (err, meta) {
        assert(!err, "Failed to store object");
        assert.equal(testkey, meta.id, "Callback called with wrong key!")

        cb.set(testkey, "baz", meta, function(err, meta) {
            assert(!err, "Failed to set with cas");
            assert.equal(testkey, meta.id, "Callback called with wrong key!")
            // intentionally break the cas
            meta.cas.str = "123456789";
            cb.set(testkey, "bam", meta, function(err, meta) {
                assert(err, "Should error with cas mismatch");
                cb.get(testkey, function(err, doc) {
                    assert(!err, "Failed to load object");
                    assert.equal("baz", doc, "Document changed despite bad cas!")
                    setup.end()
                })
            })
        })
    });

    // test non cas updates
    var testkey2 = "01-set.js2"
    cb.set(testkey2, {foo : "bar"}, function (err, meta) {
        assert(!err, "Failed to store object");
        assert.equal(testkey2, meta.id, "Callback called with wrong key!")

        // non cas updates work too
        cb.set(testkey2, {foo : "baz"}, function(err, meta) {
            assert(!err, "Failed to set without cas");
            assert.equal(testkey2, meta.id, "Callback called with wrong key!")
            setup.end();
        })
    });
})
