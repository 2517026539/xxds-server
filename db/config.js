const env = require('./../env')

if(env === 'div') {
    module.exports = {
        host: 'localhost',
        user: 'root',
        password: '19971103hzs',
        database: 'book'
    }
} else {
    module.exports = {
        host: '39.103.143.209',
        user: 'root',
        password: '19971103hzs',
        database: 'book'
    }
}
