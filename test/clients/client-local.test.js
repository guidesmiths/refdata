const assert = require('assert')
const Client = require('../..').clients.local

describe('Local Client', () => {

    it('should start with no views', (done) => {
        Client().start({ config: {} }, (err, client) => {
            assert.ifError(err)
            done()
        })
    })

    it('should get temporal data for the specified view', (done) => {
        Client().start({
            config: {
                views: ['uk-vat-rates']
            }
        }, (err, client) => {
            assert.ifError(err)
            assert.equal(client.getTemporal('uk-vat-rates', new Date('1980-02-01T11:10:09Z')).standard, 0.15)
            assert.equal(client.getTemporal('uk-vat-rates', new Date('1991-03-19T00:00:00Z').getTime()).standard, 0.175)
            assert.equal(client.getTemporal('uk-vat-rates', '2011-01-03T23:59:59Z').standard, 0.175)
            done()
        })
    })

    it('should error when view specified in config is missing', (done) => {
        Client().start({
            config: {
                views: ['franks-last-haircut']
            }
        }, (err, client) => {
            assert(err)
            assert(/View franks-last-haircut does not exist/.test(err.message), `${err.message} id not match regex`)
            done()
        })
    })

    it('should error when the specified view has not been loaded', (done) => {
        Client().start({
            config: {}
        }, (err, client) => {
            assert.ifError(err)
            assert.throws(() => client.getTemporal('franks-last-haircut', new Date('1980-02-01T11:10:09Z')), /franks-last-haircut was not loaded/)
            done()
        })
    })

    it('should return null when no data is available for the requested time', (done) => {
        Client().start({
            config: {
                views: ['uk-vat-rates']
            }
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
                views: ['uk-vat-rates']
            }
        }, (err, client) => {
            assert.ifError(err)
            assert.throws(() => client.getTemporal('uk-vat-rates'), /undefined is not a valid timestamp/)
            assert.throws(() => client.getTemporal('uk-vat-rates', null), /null is not a valid timestamp/)
            assert.throws(() => client.getTemporal('uk-vat-rates', 'foo'), /foo is not a valid timestamp/)
            done()
        })
    })

    it('should get all views', (done) => {
        Client().start({
            config: {
                views: ['uk-vat-rates', 'non-uk-eu-msisdn-prefixes']
            }
        }, (err, client) => {
            assert.ifError(err)
            const ukVatRates = client.get('uk-vat-rates')

            assert(ukVatRates)
            assert(ukVatRates.series.length)
            assert(ukVatRates.checksum)
            assert.equal(ukVatRates.ttl, '1d')

            const nonUkEuMsisdnPrefixes = client.get('non-uk-eu-msisdn-prefixes')
            assert(nonUkEuMsisdnPrefixes)
            assert(nonUkEuMsisdnPrefixes.series.length)
            assert(nonUkEuMsisdnPrefixes.checksum)
            assert.equal(nonUkEuMsisdnPrefixes.ttl, '1d')
            done()
        })
    })

    it('should deep freeze views', (done) => {
        Client().start({
            config: {
                views: ['uk-vat-rates']
            }
        }, (err, client) => {
            assert.ifError(err)
            const view = client.getTemporal('uk-vat-rates', new Date('1980-02-01T11:10:09Z'))
            view.standard = 100
            assert.equal(view.standard, 0.15)
            done()
        })
    })
})
