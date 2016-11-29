const chalk = require('chalk')
const hogan = require('hogan.js')
const R = require('ramda')
const has = require('lodash.has')
const pad = require('lodash.padend')

const response = hogan.compile('{{{displayTracer}}} {{{displayLevel}}} {{{request.method}}} {{{response.statusCode}}} {{{request.url}}}')
const error = hogan.compile('{{{displayTracer}}} {{{displayLevel}}} {{{message}}} {{{code}}}\n{{{error.stack}}} {{{details}}}')
const info = hogan.compile('{{{displayTracer}}} {{{displayLevel}}} {{{message}}} {{{details}}}')

const colours = {
    debug: chalk.gray,
    info: chalk.white,
    warn: chalk.yellow,
    error: chalk.red,
    default: chalk.white
}

module.exports = function(event) {
    const details = R.pluck(event, [])
    const data = R.merge(event, {
        displayTracer: has(event, 'tracer') ? pad(event.tracer.substr(0, 16), 16) : pad('', 16, '-'),
        displayLevel: event.level.toUpperCase(),
        details: R.keys(details).length ? `\n ${JSON.stringify(details, null, 2)}` : ''
    })
    const colour = colours[event.level] || colours.default
    const log = console[event.level] || console.info // eslint-disable-line no-console
    if (has(event, 'response.statusCode')) log(colour(response.render(data)))
    else if (has(event, 'error.message')) log(colour(error.render(data)))
    else log(colour(info.render(data)))
}
