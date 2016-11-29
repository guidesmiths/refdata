const requireAll = require('require-all')
const path = require('path')
const crypto = require('crypto')
const R = require('ramda')
const rootDir = path.join(__dirname, '..', '..')
const async = require('async')
const freeze = require('deep-freeze')
const mostRecentFirst = function(a, b) { return new Date(b).getTime() - new Date(a).getTime() }
const byId = function(a, b) { return a.localeCompare(b) }

module.exports = function() {

    function start(dependencies, cb) {

        const config = R.merge({ viewsDir: path.resolve(rootDir, 'views'), dataDir: path.resolve(rootDir, 'data'), views: [] }, dependencies.config)
        const viewDefinitions = loadViewDefinitions(config.viewsDir)
        const cache = {}

        function list() {
            return R.compose(R.reduce(toViewSummary, {}), R.sort(byId), R.keys())(cache)
        }

        const toViewSummary = function(summary, id) {
            summary[id] = { description: cache[id].description, from: R.last(cache[id].series).start, ttl: cache[id].ttl }
            return summary
        }

        function getTemporal(id, when) {
            if (!cache[id]) throw new Error(`${id} was not loaded`)
            if (when === null || when === undefined || !isFinite(new Date(when))) throw new Error(`${when} is not a valid timestamp`)
            const isOnOrAfterStart = R.propSatisfies(start => new Date(when) >= new Date(start), 'start')
            const isBeforeEnd = R.propSatisfies(end => !end || new Date(when) < new Date(end) , 'end')
            const forTimePeriod = R.allPass([isOnOrAfterStart, isBeforeEnd])
            const slice = R.find(forTimePeriod, cache[id].series)
            return slice ? slice.data : null
        }

        function get(id) {
            return cache[id]
        }

        function load(id, cb) {
            const definition = viewDefinitions[id]
            if (!definition) return cb(new Error(`View ${id} does not exist`))
            const timeIndexedData = loadData(definition.source)
            const series = generateViewSeries(timeIndexedData, definition.transform)
            cache[id] = R.merge(definition, { series: freeze(series), checksum: checksum(JSON.stringify(series)) })
            cb()
        }

        function loadViewDefinitions(viewsDir) {
            return requireAll({
                dirname: viewsDir,
                map: (name, viewPath) => {
                    return require(viewPath).id
                }
            })

        }

        function loadData(source) {
            return requireAll({
                dirname: path.resolve(config.dataDir, source),
                filter: /(.*)\.json$/,
                map: (name, path) => {
                    return name.replace(/T(\d{2})-(\d{2})-(\d{2})Z/, (match, hours, minutes, seconds) => `T${hours}:${minutes}:${seconds}Z`)
                }
            })
        }

        function generateViewSeries(timeIndexedData, transform) {
            let previousTimestamp = null
            const timestamps = R.sort(mostRecentFirst, R.keys(timeIndexedData))
            const series = timestamps.map((timestamp) => {
                const result = {
                    start: timestamp,
                    end: previousTimestamp,
                    data: transform ? transform(timeIndexedData[timestamp]) : timeIndexedData[timestamp]
                }
                previousTimestamp = timestamp
                return result
            })
            return series
        }

        function checksum(str) {
            return crypto.createHash('md5').update(str, 'utf8').digest('hex')
        }

        async.eachSeries(config.views, load, (err) => {
            cb(err, { list: list, get: get, getTemporal: getTemporal })
        })

    }

    return {
        start: start
    }
}
