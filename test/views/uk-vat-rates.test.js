const assert = require('assert')
const Client = require('../../lib/clients').local

describe('UK Vat Rates', () => {

    const id = 'uk-vat-rates'
    let view

    before((done) => {
        Client().start({ config: { views: [id] }}, (err, client) => {
            assert.ifError(err)
            view = client.get(id)
            done()
        })
    })

    it('should be a temporal view', () => {
        assert.equal(view.series.length, 5)
        assert.equal(view.series[0].start, '2011-01-04T00:00:00Z')
        assert.equal(view.series[0].end, null)
        assert.equal(view.series[0].data.standard, 0.20)

        assert.equal(view.series[1].start, '2010-01-01T00:00:00Z')
        assert.equal(view.series[1].end, '2011-01-04T00:00:00Z')
        assert.equal(view.series[1].data.standard, 0.175)
    })
})
