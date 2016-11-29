const R = require('ramda')

const inEu = R.propEq('eu', true)
const notUK = R.propSatisfies(dialing_code => dialing_code !== '44', 'dialing_code')
const inEuButNotUK = R.allPass([inEu, notUK])
const byDialingCodeAscending = function(a, b) { return parseInt(a, 10) - parseInt(b, 10) }
const toPrefix = function(location) {
    return `00${location.dialing_code}`
}

module.exports = {
    id: 'non-uk-eu-msisdn-prefixes',
    description: 'Non UK, EU MSISDN prefixes - required to price mobile usage',
    source: 'locations',
    transform: R.compose(R.map(toPrefix), R.sort(byDialingCodeAscending), R.filter(inEuButNotUK)),
    ttl: '1d'
}
