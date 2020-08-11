const config = require('./config')
const mysql = require('mysql')
const { debug } = require('./../utils/constant')

function connect(){
    return mysql.createConnection(config);
}

function querySql(sql){
    const con = connect();
    debug && console.log(sql)
    return new Promise((resolve,reject)=>{
        try{
            con.query(sql,(err,results)=>{
                if (err){
                    debug && console.log('查询失败，原因：', JSON.stringify(err))
                    reject(err)
                }else{
                    debug && console.log('查询成功',JSON.stringify(results))
                    resolve(results)
                }
            })
        }catch (e) {
            reject(e)
        }finally {
            con.end()
        }
    })
}

function queryOne(sql){
    const con = connect()
    return new Promise((resolve,reject)=>{
        try{
            con.query(sql,(err,result)=>{
                if (result && result.length > 0){
                    resolve(result[0])
                }else{
                    resolve(null)
                }
            })
        }catch(err){
            reject(err)
        }finally {
            con.end()
        }
    })
}

function create(sql){
    const con = connect()
    return new Promise((resolve,reject) => {
        try{
            con.query(sql, (err, results) => {
                if (err){
                    reject(new Error(err))
                } else {
                    resolve('记录插入成功')
                }
            })
        }catch(err){
            reject(err)
        }finally{
            con.end()
        }
    })
}

function del(sql){
    const con = connect()
    return new Promise((resolve, reject) => {
        try{
            con.query(sql,(err) => {
                if (err) {
                    reject(new Error(err))
                } else {
                    resolve('删除成功')
                }
            })
        }catch(e){
            reject(new Error(e))
        }finally{
            con.end()
        }
    })
}

function update(sql){
    const con = connect()
    return new Promise((resolve, reject) => {
        try{
            con.query(sql,(err) => {
                if (err) {
                    reject(new Error(err))
                } else {
                    resolve('更新成功')
                }
            })
        }catch(e){
            reject(new Error(e))
        }finally{
            con.end()
        }
    })
}

module.exports = {
    querySql,
    queryOne,
    create,
    del,
    update
}