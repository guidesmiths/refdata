module.exports = {
    id: 'uk-vat-rates',
    description: 'A list of UK VAT Rates',
    source: 'vat',
    transform: (vat) => vat.uk,
    ttl: '1d'
}
