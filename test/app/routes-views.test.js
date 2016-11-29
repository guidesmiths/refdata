    const assert = require('chai').assert
const request = require('request')
const system = require('../../lib/system')

describe('Views API', () => {

    let sys

    beforeEach((done) => {
        sys = system().start(done)
    })

    afterEach((done) => {
        if (!sys) return done()
        sys.stop(done)
    })

    it('should return 404 for unknown views', (done) => {
        view('franks-last-haircut', {}, (err, res, body) => {
            assert.ifError(err)
            assert.equal(res.statusCode, 404)
            done()
        })
    })

    it('should use ETags', (done) => {
        view('non-uk-eu-msisdn-prefixes', {}, (err, res, body) => {
            assert.ifError(err)
            assert.equal(res.statusCode, 200)
            assert.ok(res.headers.etag)
            view('non-uk-eu-msisdn-prefixes', { 'If-None-Match': res.headers.etag }, (err, res, body) => {
                assert.ifError(err)
                assert.equal(res.statusCode, 304)
                done()
            })
        })
    })

    it('should use Cache-Control', (done) => {
        view('non-uk-eu-msisdn-prefixes', {}, (err, res, body) => {
            assert.ifError(err)
            assert.equal(res.statusCode, 200)
            assert.equal(res.headers['cache-control'], `max-age=${24 * 60 * 60}`)
            done()
        })
    })

    it('Non UK European MSISDN Prefixes', (done) => {
        view('non-uk-eu-msisdn-prefixes', {}, (err, res, body) => {
            assert.ifError(err)
            assert.equal(res.statusCode, 200)
            assert.equal(res.headers['content-type'], 'application/json; charset=utf-8')
            assert.ok(res.body)
            done()
        })
    })

    function view(id, headers, cb) {
        request({ uri: `http://localhost:3005/api/1.0/views/${id}`, headers: headers, json: true }, cb)
    }
})
