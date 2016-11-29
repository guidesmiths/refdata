const assert = require('chai').assert
const request = require('request')
const system = require('../../lib/system')

describe('Meta API', () => {

    let sys

    before((done) => {
        sys = system().start((err, components) => {
            if (err) return done(err)
            done()
        })
    })

    after((done) => {
        if (!sys) return done()
        sys.stop(done)
    })

    it('should get some basic manifest', (done) => {
        manifest((err, response, body) => {
            assert.ifError(err)
            assert.isNotNull(body)
            done()
        })
    })

    it('should get a visible list of endpoints', (done) => {
        routes((err, response, body) => {
            assert.ifError(err)
            assert.isNotNull(body)
            assert.equal(response.statusCode, 200)
            done()
        })
    })

    it('should get some metrics', (done) => {
        metrics((err, response, body) => {
            assert.ifError(err)
            assert.isNotNull(body)
            assert.ok(/nodejs_memory_heap_used_bytes/.test(body))
            assert.ok(/nodejs_memory_heap_total_bytes/.test(body))
            metrics((err, response, body) => {
                assert.ifError(err)
                assert.isNotNull(body)
                assert.ok(/http_request_seconds_bucket.*metrics.*1/.test(body))
                done()
            })
        })
    })


    function manifest(cb) {
        request({ method: 'GET', uri: 'http://localhost:3005/meta/manifest', json: true }, (err, response, body) => {
            cb(err, response, body);
        })
    }

    function routes(cb) {
        request({ method: 'GET', uri: 'http://localhost:3005/meta/routes' }, (err, response, body) => {
            cb(err, response, body);
        })
    }

    function metrics(cb) {
        request({ method: 'GET', uri: 'http://localhost:3005/meta/metrics' }, (err, response, body) => {
            cb(err, response, body);
        })
    }
})
