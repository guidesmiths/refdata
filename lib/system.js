const System = require('systemic')
const optional = require('optional')
const path = require('path')
const EventEmitter = require('events')
const app = require('systemic-express').app
const server = require('systemic-express').server
const defaultMiddleware = require('systemic-express').defaultMiddleware
const infra = require('./infra')

const pkg = require('../package')
const manifest = optional(path.join(process.cwd(), 'manifest.json')) || {}

const refdata = require('./clients').local
const routes = require('./app/routes')

module.exports = function() {
    return new System()
        .add('config', infra.confabulous(), { scoped: true })
        .add('pkg', pkg)
        .add('manifest', manifest)
        .add('emitter', new EventEmitter())
        .add('transports', infra.transports)
        .add('logger', infra.prepper()).dependsOn('config', 'pkg', 'transports')
        .add('prometheus', infra.prometheus()).dependsOn('app', 'logger')
        .add('app', app()).dependsOn('config', 'logger')
        .add('refdata', refdata()).dependsOn('config', 'logger')
        .add('routes', routes()).dependsOn('config', 'app', 'refdata')
        .add('middleware.logger', infra.prepperMiddleware()).dependsOn('app')
        .add('middleware.meta', infra.metaMiddleware()).dependsOn('middleware.logger', 'app', 'manifest', 'prometheus')
        .add('middleware.default', defaultMiddleware({ })).dependsOn('config', 'logger', 'app')
        .add('server', server()).dependsOn('config', 'logger', 'app', 'routes', 'middleware.meta')
}
