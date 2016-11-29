const Prometheus = require('uw-lib-prometheus.js')

module.exports = function(options) {

    function start(dependencies, cb) {
        const prometheus = new Prometheus()

        prometheus.newHistogram(
            'http_request_seconds',
            'Measures request duration',
            ['http_status', 'route', 'http_method'],
            { buckets: [0.01, 0.03, 0.1, 0.2, 0.3, 0.5, 0.7, 1, 1.5, 2, 3, 5, 10] }
        )

        prometheus.newGauge(
          'nodejs_memory_heap_used_bytes',
          'process.memoryUsage().heapUsed'
        )

        prometheus.newGauge(
          'nodejs_memory_heap_total_bytes',
          'process.memoryUsage().heapTotal'
        )

        dependencies.app.use(prometheus.middlewares.requestDuration('http_request_seconds'))

        cb(null, prometheus)
    }

    return {
        start: start
    }
}
