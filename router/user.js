let express = require('express')
let Result = require('./../models/results')
const { secretKey, JWT_EXPIRED} = require('./../utils/constant')
const jwt = require('jsonwebtoken')
const boom = require('boom')
const {body, validationResult} = require('express-validator')
const {login, getInfo} = require('./../services/user')
const { verifyToken } = require('./../utils/index')

const router = express.Router()


router.get('/',(req,res)=>{
    let data = 'xiaoxiandaren';
    res.send(data);
})

router.get('/info',(req,res)=>{
    let {authorization} = req.headers
    let username = verifyToken(authorization)
    if(username && username.username){
        getInfo({username: username.username}).then(user=>{
            if (user){
                user.roles = [user.role]
                new Result(user,'用户信息请求成功').success(res)
            }else{
                new Result('用户信息请求失败').fail(res)
            }
        })
    }else{
        new Result('用户信息请求失败')
    }
})

router.post('/login',[
    body('username').isString().withMessage('username类型不正确'),
    body('password').isString().withMessage('password类型不正确')
],(req,res,next)=>{
    const err = validationResult(req)
    if(!err.isEmpty()){
        const [{msg}] = err.errors
        next(boom.badRequest(msg))
    }else{
        login({username: req.body.username,password: req.body.password})
            .then(result => {
                if (result && result.length !== 0){
                    const token = jwt.sign(
                        {username: req.body.username},
                        secretKey,
                        {
                            expiresIn: JWT_EXPIRED
                        }
                    )
                    new Result({Token: token},'登录成功').success(res)
                }else{
                    new Result('登录失败').fail(res)
                }
            })
    }
})

module.exports = router