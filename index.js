module.exports = module === require.main
    ? require('./lib/server')
    : { clients: require('./lib/clients') }

