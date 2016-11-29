const R = require('ramda')
const async = require('async')
const request = require('request')
const freeze = require('deep-freeze')
const parseDuration = require('parse-duration')
const parseCacheControl = require('parse-cache-control')

module.exports = function() {

    function start(dependencies, cb) {
        const logger = dependencies.logger
        const config = R.merge({ views: [], retries: { times: 3, interval: 1000 }, tick: '10m' }, dependencies.config)
        const cache = {}
        const metadata = {}

        function getTemporal(id, when) {
            if (!metadata[id]) throw new Error(`${id} was not loaded`)
            if (when === null || when === undefined || !isFinite(new Date(when))) throw new Error(`${when} is not a valid timestamp`)
            const isOnOrAfterStart = R.propSatisfies(start => new Date(when) >= new Date(start), 'start')
            const isBeforeEnd = R.propSatisfies(end => !end || new Date(when) < new Date(end) , 'end')
            const forTimePeriod = R.allPass([isOnOrAfterStart, isBeforeEnd])
            const entry = R.find(forTimePeriod, cache[id])
            return entry ? entry.data : null
        }

        function load(id, cb) {
            async.retry(config.retries, (cb) => {
                const url = `${config.url}/api/1.0/views/${id}`
                const headers = metadata[id] ? { 'If-None-Match': metadata[id].etag } : {}
                logger.info(`Loading refdata from ${url}`)
                request({ url: url, json: true, headers: headers }, (err, res, body) => {
                    if (err) return cb(err)
                    if (res.statusCode >= 400) return cb(new Error(`${url} returned ${res.statusCode}`))
                    if (res.statusCode === 304) return cb()
                    metadata[id] = { etag: res.headers.etag, ttl: getTTL(res.headers['cache-control']), loaded: Date.now() }
                    cache[id] = freeze(res.body)
                    cb()
                })
            }, cb)
        }

        function getTTL(cacheControl) {
            const maxAge = cacheControl ? parseCacheControl(cacheControl)['max-age'] : 60 * 60
            return `${maxAge}s`
        }

        function refresh(id, cb) {
            if (!metadata[id]) return cb(new Error(`${id} was not loaded`))
            const previousEtag = metadata[id].etag
            load(id, (err) => {
                if (err) return cb(err)
                cb(null, previousEtag !== metadata[id].etag)
            })
        }

        function refreshExpiredViews() {
            const expired = R.filter(byExpiredTTL, R.keys(metadata))
            async.eachSeries(expired, refresh, (err) => {
                if (err) logger.error('Error reloading refdata', err)
                scheduleRefreshExpiredViews()
            })
        }

        function scheduleRefreshExpiredViews() {
            setTimeout(refreshExpiredViews, parseDuration(config.tick))
        }

        function byExpiredTTL(id) {
            return parseDuration(metadata[id].ttl || '1h') < Date.now() - metadata[id].loaded
        }

        async.each(config.views, load, (err) => {
            if (err) return cb(err)
            scheduleRefreshExpiredViews()
            cb(null, { getTemporal: getTemporal, refresh: refresh })
        })
    }

    return {
        start: start
    }
}
