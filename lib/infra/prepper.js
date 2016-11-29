const get = require('lodash.get')

module.exports = function(options = {}) {

    const prepper = options.prepper || require('prepper')
    const handlers = prepper.handlers

    function start(dependencies, cb) {
        const transport = options.transport !== undefined ? options.transport : get(dependencies.transports, dependencies.config.transport)
        const pkg = dependencies.pkg || { name: 'unknown' }

        const logger = new prepper.Logger([
            new handlers.Merge({ service: { name: pkg.name, env: process.env.REFDATA_ENV } })
        ]).on('message', function(event) {
            if (transport) transport(event)
        })

        cb(null, logger)
    }

    return {
        start: start
    }
}
