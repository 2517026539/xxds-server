const { isObject, keysAndValues} = require('./../utils/index')
const Book = require('./../models/book')
const { create, queryOne, querySql, del, update} = require('./../db/index')

//是否存在该电子书
function isExitBook( book ){
    return new Promise((resolve, reject) => {
        const { title, author, publisher, updateType} = book
        const sql = `select * from book  where \`title\` = '${title}' and \`author\` = '${author}' and \`publisher\` = '${publisher}' and \`updateType\` = '${updateType}'`
        queryOne(sql).then(result => {
            if (result) {
                resolve(true)
            } else {
              resolve(false)
            }
        }).catch(err => {
            reject(new Error('服务器出错'))
        })
    })
}

//删除电子书
async function removeBook( fileName, k ){
    if (fileName) {
        const sql = `delete from ${k} where \`fileName\` = '${fileName}'`
        await del(sql)
    }
}

//添加contents记录
function createContents (book){
    return new Promise(async(resolve, reject) => {
        const arr_contents = book.getContents()
        for( let i =0; i < arr_contents.length; i++){
            if (arr_contents[i].fileName && arr_contents[i].navId){
                const {keys, values} = keysAndValues(arr_contents[i])
                const sql = `insert into contents (${keys.join(',')}) values (${values.join(',')})`
                await create(sql)
            } else {
                reject(new Error('目录表数据不完整'))
            }
        }
        resolve('contents插入成功')
    })
}

//添加book记录
function createBook( book ){
    return new Promise(async (resolve, reject) => {
        if (book instanceof Book){
            let isExit = await isExitBook(book)
            if (!isExit){
                const obj_book = book.getBook()
                if (isObject(obj_book)){
                    const {keys ,values} = keysAndValues(obj_book)
                    const sql = `insert into book (${keys.join(',')}) values (${values.join(',')})`
                    await create(sql)
                    await createContents(book)
                    resolve('新增电子书成功')
                } else {
                    reject('参数错误')
                }
            } else {
                book.reset()
                await Promise.all([removeBook(book.fileName, 'contents'), removeBook(book.fileName, 'book')])
                reject('电子书已存在')
            }
        } else {
            reject('对象不合法')
        }
    })
}

//获取电子书记录
function getBook( data ){
    const { fileName } = data
    return new Promise(async (resolve) => {
        const bookSql = `select * from book where \`fileName\` = '${fileName}'`
        const contentsSql = `select * from contents where \`fileName\` = '${fileName}' order by \`order\``
        const book = await queryOne(bookSql)
        const contents = await querySql(contentsSql)
        if (book && contents){
            const book_json = JSON.parse(JSON.stringify(book))
            const contents_json = JSON.parse(JSON.stringify(contents))
            resolve({...book_json,contents:contents_json})
        } else {
          resolve(null)
        }
    })
}

//更新book记录
function updateBook(book){
    return new Promise(async (resolve,reject) => {
        const { title, language, publisher, author, username, fileName } = book
        const sql = `update book set \`title\` = '${title}',\`language\` = '${language}',\`publisher\` = '${publisher}',\`author\` = '${author}',\`updateDt\` = '${new Date().valueOf()}',\`createUser\` = '${username}' where \`fileName\` = '${fileName}'`
        await update(sql)
        resolve('更新成功')
    })
}

//获取分类列表
function getcategories(){
    return new Promise((resolve, reject) => {
        const sql = 'select * from category order by num desc'
        querySql(sql).then(result => {
            resolve(JSON.parse(JSON.stringify(result)))
        }).catch(err => {
            reject(err)
        })
    })
}

//获取电子书列表
function getBookList(query) {
    function makeSql(query) {
        const { title = '', author = '', category = '', pageSize, page, sort = ''} = query
        const baseSql = `select * from book `
        let limitoffset = `limit ${pageSize} offset ${(page - 1) * pageSize}`
        const conditionSql = {
            sql: 'where ',
            used: false
        }
        let sortSql = ''
        if(sort) {
            const sortkey = sort.substring(1)
            const sortSize = sort.charAt(0) === '+' ? 'asc' : 'desc'
            sortSql = `order by ${sortkey} ${sortSize}`
            limitoffset = `${sortSql} ${limitoffset}`
        }

        if (title) {
            if (!conditionSql.used){
                conditionSql.used = true
                conditionSql.sql = `${conditionSql.sql}\`title\` like '%${title}%' `
            } else {
                conditionSql.sql = `${conditionSql.sql}and \`title\` = '%${title}%' `
            }
        }
        if (author) {
            if (!conditionSql.used){
                conditionSql.used = true
                conditionSql.sql = `${conditionSql.sql}\`author\` like '%${author}%' `
            } else {
                conditionSql.sql = `${conditionSql.sql}and \`author\` like '%${author}%' `
            }
        }
        if (category) {
            if (!conditionSql.used){
                conditionSql.used = true
                conditionSql.sql = `${conditionSql.sql}\`categoryText\` = '${category}' `
            } else {
                conditionSql.sql = `${conditionSql.sql}and \`categoryText\` = '${category}' `
            }
        }
        const sql = conditionSql.used ? `${baseSql}${conditionSql.sql}${limitoffset}` : `${baseSql}${limitoffset}`
        const sumSql = conditionSql.used ? `select count(fileName) as count from book ${conditionSql.sql}` : `select count(fileName) as count from book`
        return {sql,sumSql}
    }
    return new Promise((async (resolve, reject) => {
        try{
            const {sql, sumSql} = makeSql(query)
            const bookList =await querySql(sql)
            const count = await queryOne(sumSql)
            resolve({bookList: JSON.parse(JSON.stringify(bookList)),... JSON.parse(JSON.stringify(count))})
        }catch (e) {
            reject(e)
        }
    }))
}

//删除电子书
function deleteBook(fileName) {
    return new Promise(async (resolve, reject) => {
        const sql = `delete from book where \`fileName\` = '${fileName}'`
        const contentsSql = `delete from contents where \`fileName\` = '${fileName}'`
        try{
            await del(sql)
            await del(contentsSql)
            resolve('删除成功')
        } catch (e) {
            reject(new Error(e))
        }

    })
}

module.exports = {
    createBook,
    getBook,
    updateBook,
    getcategories,
    getBookList,
    deleteBook
}