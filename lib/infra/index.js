const requireAll = require('require-all')

module.exports = requireAll({
    dirname: __dirname,
    map: (name, path) =>
        name.replace(/[_-]([a-z])/g, (m, c) =>
            c.toUpperCase()
        )
})
