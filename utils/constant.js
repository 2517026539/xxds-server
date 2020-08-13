const env = require('./../env')
let BOOK_URL = env === 'dev' ? 'http://localhost:8089' : 'http://39.103.143.209:80'
let BOOK_PATH = env === 'dev' ? 'D:/upload/' : '/root/nginx/upload/'
let BOOKTEST_PATH = env === 'dev' ? 'D:/upload/bookTest' : '/root/nginx/upload/bookTest'

module.exports = {
    CODE_ERROR: 0,
    CODE_TOKEN: -1,
    CODE_SUCCESS: 200,
    debug: false,
    PWD_SALT: 'admin_imooc_node',
    secretKey: 'xiaoxiandushu',
    JWT_EXPIRED: 60*60*24,
    MIME_TYPE_EPUB: 'application/epub+zip',
    BOOK_URL,
    BOOK_PATH,
    BOOKTEST_PATH
}