const express = require('express')
const Result = require('./../models/results')
const multer = require('multer')
const Book = require('./../models/book')
const Boom = require('boom')
const { BOOKTEST_PATH } = require('./../utils/constant')
const { verifyToken } = require('./../utils/index')
const { createBook, getBook, updateBook, getcategories, getBookList, deleteBook} = require('./../services/book')
const upload = multer({ dest: BOOKTEST_PATH})

const router = express.Router()

router.post('/upload',upload.single('file'),(req,res,next)=>{
    if (!req.file && req.file.length === 0){
        new Result('上传电子书失败').fail(res)
    }else{
        const book = new Book(req.file)
        book.parse().then(data => {
            new Result(data,'上传电子书成功').success(res)
        }).catch(err => {
            next(Boom.badImplementation(err))
        })
    }
})

router.post('/create', (req, res, next) => {
    const { authorization } = req.headers
    const username = verifyToken(authorization)  //{ username: 'admin', iat: 1596875665, exp: 1596962065 }
    req.body.username = username.username
    const book = new Book(null,req.body)
    createBook(book).then( result => {
        new Result(result,'新增电子书成功').success(res)
    }).catch(err => {
        next(Boom.badImplementation(err))
    })
})

router.post('/cancelupload', (req, res, next) => {
    const book = new Book(null,req.body)
    try{
        book.reset()
        new Result('取消上传成功').success(res)
    } catch(e) {
        throw new Error(e)
    }
})

router.get('/getbook',(req, res, next) => {
    const { fileName } = req.query
    getBook({ fileName }).then(book => {
        if (book) {
            const getOneBook = new Book(null, book)
            getOneBook.makeContentsTree()
            new Result(getOneBook,'获取电子书数据成功').success(res)
        }else {
            new Result('没有找到该记录').fail(res)
        }
    }).catch(err => {
        next(Boom.badImplementation(err))
    })
})

router.post('/update', (req, res, next) => {
    const { authorization } = req.headers
    const { username } = verifyToken(authorization)
    req.body.username = username
    if (!Number(req.body.updateType)) {
        new Result('内置电子书不能编辑').fail(res)
    }else{
        updateBook(req.body).then(data => {
            new Result(data).success(res)
        }).catch(err => {
            next(Boom.badImplementation(err))
        })
    }
})

router.get('/getcategory', (req, res, next) => {
    getcategories().then(results => {
        new Result({ categoryList: results }, '获取分类列表成功').success(res)
    }).catch(err => {
        next(Boom.badImplementation(err))
    })
})

router.get('/getbooklist', (req, res, next) => {
    const query = req.query
    getBookList(query).then(results => {
        if(results.bookList.length > 0){
            new Result(results, '获取电子书列表成功').success(res)
        } else {
            new Result({ bookList: []}, '获取电子书列表成功').success(res)
        }
    }).catch(err => {
        next(Boom.badImplementation(err))
    })
})

router.post('/delete', (req, res, next) => {
    const book = new Book(null,req.body.book)
    if (!Number(book.updateType)) {
        new Result('内置图书不能删除').fail(res)
    } else {
        //删除目标资源
        book.reset()
        const { fileName } = book
        //删除数据库记录
        deleteBook(fileName).then(result => {
            new Result(result).success(res)
        }).catch(err => {
            next(Boom.badImplementation(err))
        })

    }
})

module.exports = router