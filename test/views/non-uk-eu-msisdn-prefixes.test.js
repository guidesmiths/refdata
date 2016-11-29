const assert = require('assert')
const Client = require('../../lib/clients').local
const R = require('ramda')

describe('Non UK EU MSISDN Prefixes', () => {

    const id = 'non-uk-eu-msisdn-prefixes'
    let view

    before((done) => {
        Client().start({ config: { views: [id] }}, (err, client) => {
            assert.ifError(err)
            view = client.get(id)
            done()
        })
    })

    it('should be a temporal view', () => {
        assert.equal(view.series.length, 1)
        assert.equal(view.series[0].start, '2016-06-01T23:00:00Z')
        assert.equal(view.series[0].end, null)
    })

    it('should include european locations', () => {
        includesPrefix('0033')
        includesPrefix('0049')
        assert.equal(view.series[0].data.length, 27) // 28 EU member stats - 1 (UK) = 27
    })

    it('should exclude UK', () => {
        excludesLocation('0044')
    })

    it('should prefix dialing codes with 00', () => {
        view.series[0].data.forEach((prefix) => {
            assert(/^00\d+$/.test(prefix))
        })
    })

    function includesPrefix(prefix, locations) {
        assert(R.contains(prefix, view.series[0].data), `${prefix} was not included`)
    }

    function excludesLocation(prefix, locations) {
        assert(!R.contains(prefix, view.series[0].data), `${prefix} was not included`)
    }

})
