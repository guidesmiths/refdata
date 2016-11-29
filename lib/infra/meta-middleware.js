module.exports = function() {

    function start(dependencies, cb) {

        const app = dependencies.app
        const manifest = dependencies.manifest
        const prometheus = dependencies.prometheus

        app.get('/meta/manifest', (req, res, next) => {
            res.json(manifest)
        })

        app.get('/meta/routes', (req, res, next) => {
            const routes = app._router.stack.filter(r => r.route).map(r => `<li>${r.route.path}</li>`).join('')
            res.send(`<h1>Available Routes</h1>\n<ul>${routes}</ul>`);
        })

        app.get('/meta/metrics',
            prometheus.middlewares.heapUsage('nodejs_memory_heap_used_bytes', 'nodejs_memory_heap_total_bytes'),
            prometheus.middlewares.report()
        )

        app.get('/meta/error', (req, res, next) => {
            next(new Error('Test Error'))
        })

        cb()
    }

    return {
        start: start
    }
}

