const confabulous = require('confabulous')
const path = require('path')

module.exports = function() {

    const Confabulous = confabulous.Confabulous
    const loaders = confabulous.loaders

    function start(cb) {
        const confabulous = new Confabulous()
        confabulous.add(config => loaders.require({ path: path.join(process.cwd(), 'conf', 'default.js') }))
        confabulous.add(config => loaders.require({ path: path.join(process.cwd(), 'conf', `${process.env.REFDATA_ENV}.js`), mandatory: false }))
        confabulous.add(config => loaders.args())
        confabulous.end(cb)
    }

    return {
        start: start
    }

}
