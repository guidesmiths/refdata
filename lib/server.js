const system = require('./system')
const runner = require('systemic-domain-runner')
const bunyan = require('bunyan')
const name = require('../package.json').name
const log = bunyan.createLogger({ name: name })

process.env.REFDATA_ENV = process.env.REFDATA_ENV || 'local'

runner(system()).start((err, components) => {
   if (err) die('Error starting system', err)
   components.emitter.emit('system started')
})

process.on('unhandledRejection', (err) => {
    log.error(err, 'Unhandled Rejection')
})

function die(message, err) {
    log.error(err, message)
    process.exit(1)
}
