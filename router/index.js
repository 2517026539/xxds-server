const express = require('express')
const boom = require('boom')
const userRouter = require('./user')
const bookRouter = require('./book')
const Result = require('./../models/results')
const jwtAuth = require('./jwt')

const router = express.Router()

router.use(jwtAuth)
router.use('/user',userRouter)
router.use('/book',bookRouter)

router.get('/',(req,res)=>{
    res.send('xiaoxian')
})



/*
* 集中处理404请求
* */
router.use((req,res,next)=>{
    next(boom.notFound('接口找不到'))
})

/*
* 异常处理
* */
router.use((err, req, res, next) => {
    if (err.name === 'UnauthorizedError'){
        const {name,message,status} = {...err}
        new Result(null,'token失败',{
            status: status,
            errorMsg: message
        }).expired(res.status(err.status))
    }else{
        const msg = (err && err.message) || '系统错误'
        const statusCode = (err.output && err.output.statusCode) || 500;
        const errorMsg = (err.output && err.output.payload && err.output.payload.error) || err.message
        new Result(null,msg,{
            errorMsg,
            status: statusCode
        }).fail(res.status(statusCode))
    }
})

module.exports = router