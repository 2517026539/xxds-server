let { CODE_ERROR,CODE_SUCCESS,CODE_TOKEN} = require('./../utils/constant')

class Result{
    constructor(data,msg = '操作成功',options) {
        this.code = 200;
        this.data = null;
        if (arguments.length === 0){
            this.msg = msg;
        }else if (arguments.length === 1){
            this.msg = data;
        }else{
            this.msg = msg;
            this.data = data;
            if (options){
                this.options = options;
            }
        }
    }

    createResult(){
        let baseResult = {
            code: this.code,
            msg: this.msg,
        }

        if(this.data){
            baseResult.data = this.data;
        }

        if(this.options){
            baseResult = Object.assign(baseResult,{options: this.options});
        }

        return baseResult;
    }

    json(res){
        res.json(this.createResult());
    }

    success(res){
        this.code = CODE_SUCCESS;
        this.json(res);
    }

    fail(res){
        this.code = CODE_ERROR;
        this.json(res)
    }

    expired(res){
        this.code = CODE_TOKEN
        this.json(res)
    }
}

module.exports = Result