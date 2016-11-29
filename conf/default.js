module.exports = {
    server: {
        port: 3004
    },
    refdata: {
        views: [ 'uk-vat-rates', 'non-uk-eu-msisdn-prefixes']
    },
    logger: {
        transport: 'bunyan'
    }
}
