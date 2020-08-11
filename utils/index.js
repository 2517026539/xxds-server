const crypto = require('crypto')
const jwt = require('jsonwebtoken')
const { secretKey } = require('./constant')

function keysAndValues(obj){
    const keys = []
    const values = []
    Object.keys(obj).forEach(item => {
        if (obj.hasOwnProperty(item)) {
            keys.push(`\`${item}\``)
            values.push(`'${obj[item]}'`)
        }
    })
    return {
        keys,
        values
    }
}

function isObject(obj){
    return Object.prototype.toString.call(obj) === "[object Object]"
}

function md5(s) {
    return crypto.createHash('md5')
        .update(String(s)).digest('hex');
}

function verifyToken(authorization) {
    let token = '';
    if (authorization.indexOf('Bearer ') === 0) {
         token = authorization.replace('Bearer ', '')
    }
    return jwt.verify(token, secretKey);
}

module.exports = {
    md5,
    verifyToken,
    isObject,
    keysAndValues
}