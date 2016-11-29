const parseDuration = require('parse-duration')

module.exports = function() {

    function start(dependencies, cb) {

        const app = dependencies.app
        const refdata = dependencies.refdata

        app.get('/api/1.0/views/:id', (req, res, next) => {
            const view = refdata.get(req.params.id)
            if (!view) return next()
            if (req.get('If-None-Match') === view.checksum) return res.status(304).end()
            const maxAge = parseDuration(view.ttl || '1h') / 1000
            res.set('ETag', view.checksum)
            res.set('Cache-Control', `max-age=${maxAge}`)
            res.json(view.series)
        })

        app.get('/api/1.0/views', (req, res, next) => {
            res.json(refdata.list())
        })

        cb()
    }

    return {
        start: start
    }
}
