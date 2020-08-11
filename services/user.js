const {querySql,queryOne} = require('./../db/index')
const { PWD_SALT} = require('./../utils/constant')
const {md5} = require('./../utils/index')

function login({username, password}){
    const pwd = md5(`${password}${PWD_SALT}`)
    return querySql(`select * from admin_user where username = '${username}' and password = '${pwd}'`)
}

function getInfo({username}){
    return queryOne(`select id,username,role,nickname,avatar from admin_user where username = '${username}'`)
}

module.exports = {
    login,
    getInfo
}