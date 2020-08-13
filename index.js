const express = require('express');
const https = require('https')
const fs = require('fs')
const cors = require('cors')
let bodyParser = require('body-parser')

const app = express()
const port = 3000
const router = require('./router/index')

const options = {
    key: fs.readFileSync('./https/4285447_www.lijiaxian.com.key','utf-8'),
    cert: fs.readFileSync('./https/4285447_www.lijiaxian.com.pem','utf-8')
}
app.use(cors())
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use('/',router)

const httpsServer = https.createServer(options,app);

app.listen(port, ()=>{
    console.log('当前环境变量', process.env);
    console.log('server is running on http://localhost:%s',port)
})
httpsServer.listen(18082,()=>{
    console.log('https server is running on https://localhost:18082')
})
