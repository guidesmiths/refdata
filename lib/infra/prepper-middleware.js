const async = require('async')
const R = require('ramda')
const onHeaders = require('on-headers')

module.exports = function(options = {}) {

    const prepper = options.prepper || require('prepper')
    const handlers = prepper.handlers
    let app

    function init(dependencies, cb) {
        app = dependencies.app
        cb()
    }

    function validate(cb) {
        if (!app) return cb(new Error('app is required'))
        cb()
    }

    function start(cb) {
        app.use((req, res, next) => {
            const logger = req.app.locals.logger.child({ handlers: [
                new handlers.Tracer({ tracer: req.get('x-request-id') }),
                new handlers.Merge(R.pick(['url', 'method', 'headers', 'params'], req), { key: 'request' })
            ]})

            onHeaders(res, () => {
                const response = { response: { statusCode: res.statusCode, headers: res.headers } }
                if (res.statusCode < 400) logger.debug(req.url, response)
                else if (res.statusCode < 500) logger.warn(req.url, response)
                else logger.error(req.url, response)

                if (req.get('x-request-id')) res.set('x-request-id', req.get('x-request-id'))
            })

            res.locals.logger = logger

            next()
        })

        cb()
    }

    return {
        start: async.seq(init, validate, start)
    }
}
