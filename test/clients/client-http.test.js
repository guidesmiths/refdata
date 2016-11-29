const assert = require('assert')
const Client = require('../..').clients.http
const express = require('express')

describe('Http Client', () => {

    const app = express()
    const logger = { info: () => {} }
    let server

    before((done) => {

        app.get('/api/1.0/views/uk-vat-rates', (req, res) => {
            if (res.get('If-None-Match') === 'fixed') return res.send(304)
            res.set('ETag', 'fixed')
            res.json([{
                start: '1979-06-18T00:00:00Z',
                end: '1991-03-19T00:00:00Z',
                data: { standard: 0.15 }
            }, {
                start: '1991-03-19T00:00:00Z',
                end: '2008-12-01T00:00:00Z',
                data: { standard: 0.175 }
            }, {
                start: '2008-12-01T00:00:00Z',
                end: '2010-01-01T00:00:00Z',
                data: { standard: 0.15 }
            }, {
                start: '2010-01-01T00:00:00Z',
                end: '2011-01-04T00:00:00Z',
                data: { standard: 0.175 }
            }, {
                start: '2011-01-04T00:00:00Z',
                end: null,
                data: { standard: 0.2 }
            }])
        })

        app.get('/api/1.0/views/volatile', (req, res) => {
            res.json([{
                start: '1979-06-18T00:00:00Z',
                end: null,
                data: { number: Math.random() }
            }])
        })

        app.get('/api/1.0/views/ttl', (req, res) => {
            res.setHeader('Cache-Control', 'max-age=1')
            res.json([{
                start: '1979-06-18T00:00:00Z',
                end: null,
                data: { number: Math.random() }
            }])
        })

        server = app.listen(3005, done)
    })

    after((done) => {
        if (!server) return done()
        server.close(done)
    })

    it('should start with no views', (done) => {
        Client().start({ config: {}, logger: logger }, (err, client) => {
            assert.ifError(err)
            done()
        })
    })

    it('should report connection errors', (done) => {
        Client().start({
            config: {
                url: 'http://localhost.doesnotexist',
                views: ['uk-vat-rates']
            },
            logger: logger
        }, (err, client) => {
            assert(err)
            assert(/ENOTFOUND/.test(err.message), `${err.message} id not match regex`)
            done()
        })
    })

    it('should get temporal data for the specified view', (done) => {

        Client().start({
            config: {
                url: 'http://localhost:3005',
                views: ['uk-vat-rates']
            },
            logger: logger
        }, (err, client) => {
            assert.ifError(err)
            assert.equal(client.getTemporal('uk-vat-rates', new Date('1980-02-01T11:10:09Z')).standard, 0.15)
            assert.equal(client.getTemporal('uk-vat-rates', new Date('1991-03-19T00:00:00Z').getTime()).standard, 0.175)
            assert.equal(client.getTemporal('uk-vat-rates', '2011-01-03T23:59:59Z').standard, 0.175)
            done()
        })
    })

    it('should error when view in config is missing', (done) => {
        Client().start({
            config: {
                url: 'http://localhost:3005',
                views: ['franks-last-haircut']
            },
            logger: logger
        }, (err, client) => {
            assert(err)
            assert(/views\/franks-last-haircut returned 404/.test(err.message), `${err.message} id not match regex`)
            done()
        })
    })

    it('should error when the specified view has not been loaded', (done) => {
        Client().start({
            config: {
                url: 'http://localhost:3005'
            },
            logger: logger
        }, (err, client) => {
            assert.ifError(err)
            assert.throws(() => client.getTemporal('franks-last-haircut', new Date('1980-02-01T11:10:09Z')), /franks-last-haircut was not loaded/)
            done()
        })
    })

    it('should return null when no data is available for the requested time', (done) => {
        Client().start({
            config: {
                url: 'http://localhost:3005',
                views: ['uk-vat-rates']
            },
            logger: logger
        }, (err, client) => {
            assert.ifError(err)
            assert.equal(client.getTemporal('uk-vat-rates', 0), null)
            assert.equal(client.getTemporal('uk-vat-rates', '1970-01-01T01:01:00Z'), null)
            done()
        })
    })

    it('should error when invalid time is specified', (done) => {
        Client().start({
            config: {
                url: 'http://localhost:3005',
                views: ['uk-vat-rates']
            },
            logger: logger
        }, (err, client) => {
            assert.ifError(err)
            assert.throws(() => client.getTemporal('uk-vat-rates'), /undefined is not a valid timestamp/)
            assert.throws(() => client.getTemporal('uk-vat-rates', null), /null is not a valid timestamp/)
            assert.throws(() => client.getTemporal('uk-vat-rates', 'foo'), /foo is not a valid timestamp/)
            done()
        })
    })

    it('should deep freeze views', (done) => {
        Client().start({
            config: {
                url: 'http://localhost:3005',
                views: ['uk-vat-rates']
            },
            logger: logger
        }, (err, client) => {
            assert.ifError(err)
            const view = client.getTemporal('uk-vat-rates', new Date('1980-02-01T11:10:09Z'))
            view.standard = 100
            assert.equal(view.standard, 0.15)
            done()
        })
    })

    it('should use cache', (done) => {
        Client().start({
            config: {
                url: 'http://localhost:3005',
                views: ['volatile']
            },
            logger: logger
        }, (err, client) => {
            assert.ifError(err)
            const first = client.getTemporal('volatile', new Date())
            const second = client.getTemporal('volatile', new Date())
            assert.equal(first.number, second.number)
            done()
        })
    })

    it('should refresh cache', (done) => {
        Client().start({
            config: {
                url: 'http://localhost:3005',
                views: ['volatile']
            },
            logger: logger
        }, (err, client) => {
            assert.ifError(err)
            const first = client.getTemporal('volatile', new Date())
            client.refresh('volatile', (err, updated) => {
                assert.ifError(err)
                assert(updated)
                const second = client.getTemporal('volatile', new Date())
                assert.notEqual(first.number, second.number)
                done()
            })
        })
    })

    it('should error if asked to refresh an unknown cache', (done) => {
        Client().start({
            config: {
                url: 'http://localhost:3005',
            },
            logger: logger
        }, (err, client) => {
            assert.ifError(err)
            client.refresh('franks-last-haircut', (err) => {
                assert(err)
                assert(err.message, 'franks-last-haircut was not loaded')
                done()
            })
        })
    })

    it('should honour 304s when refreshing cache', (done) => {
        Client().start({
            config: {
                url: 'http://localhost:3005',
                views: ['uk-vat-rates']
            },
            logger: logger
        }, (err, client) => {
            assert.ifError(err)
            client.refresh('uk-vat-rates', (err, updated) => {
                assert.ifError(err)
                assert(!updated)
                assert.equal(client.getTemporal('uk-vat-rates', new Date('1980-02-01T11:10:09Z')).standard, 0.15)
                done()
            })
        })
    })

    it('should automatically refresh after ttl expires', (done) => {
        Client().start({
            config: {
                url: 'http://localhost:3005',
                tick: '100ms',
                views: ['ttl']
            },
            logger: logger
        }, (err, client) => {
            assert.ifError(err)
            let first
            let second
            let third

            setTimeout(() => first = client.getTemporal('ttl', new Date()), 200)
            setTimeout(() => second = client.getTemporal('ttl', new Date()), 800)
            setTimeout(() => third = client.getTemporal('ttl', new Date()), 1200)
            setTimeout(() => {
                assert.equal(first, second, 'Cache was refreshed before TTL expired')
                assert.notEqual(second, third, 'Cache was not refreshed after TTL expired')
                done()
            }, 1500)
        })
    })

})
