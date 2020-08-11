const expressJwt = require('express-jwt')
const {secretKey } = require('./../utils/constant')

const jwtAuth = expressJwt({
    secret: secretKey,
    algorithms: ['HS256'],
    credentialsRequired: true // 设置为false就不进行校验了，游客也可以访问
}).unless({
    path: [
        '/',
        '/user/login'
    ], // 设置 jwt 认证白名单
});

module.exports = jwtAuth;