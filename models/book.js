const { MIME_TYPE_EPUB, BOOK_URL, BOOK_PATH } = require('./../utils/constant')
const Epub = require('./../utils/epub')
const xml2js = require('xml2js').parseString
const fs = require('fs')

class Book{
    static getPath(path) {
        if (path.startsWith('/')) {
            return `${BOOK_PATH}${path}`
        } else {
            return `${BOOK_PATH}/${path}`
        }
    }

    constructor(file, data) {
        if (file) {
            this.createBookFromFile(file)
        } else {
            this.createBookFromData(data)
        }
    }

    createBookFromFile(file) {
        const {
            mimetype = MIME_TYPE_EPUB,  //文件类型
            destination,  //文件本地存储路径
            filename    //当前存储文件下的文件名
        } = file
        const suffix = mimetype === MIME_TYPE_EPUB ? 'epub' : ''
        const oldBookPath = `${destination}/${filename}`
        const bookPath = `${destination}/${filename}.${suffix}`
        const url = `${BOOK_URL}/bookTest/${filename}.${suffix}`
        const unzipPath = `${BOOK_PATH}/unzipTest/${filename}`
        const unzipUrl = `${BOOK_URL}/unzipTest/${filename}`
        if (fs.existsSync(oldBookPath) && !fs.existsSync(bookPath)) {
            fs.renameSync(oldBookPath, bookPath)   //重命名文件
        }
        if (!fs.existsSync(unzipPath)) {
            fs.mkdirSync(unzipPath, {recursive: true})  //创建解压后的目录
        }
        this.fileName = filename //文件名
        this.path = `/bookTest/${filename}.${suffix}` //epub文件路径
        this.filePath = this.path //epub文件路径
        this.url = url //epub文件下载路径
        this.title = '' //标题
        this.author = '' //作者
        this.publisher = '' //出版社
        this.contents = [] //目录
        this.cover = '' //封面图片URL
        this.coverPath = '' //封面图片路径
        this.category = -1 //分类ID
        this.categoryText = '' //分类名称
        this.rootFile = '' //根文件
        this.language = '' //语言
        this.unzipPath = `/unzipTest/${filename}` //解压后的相对目录路径
        this.unzipUrl = unzipUrl //解压后电子书的下载地址
        this.originalName = file.originalname //电子书的源文件名（原名）
        this.updateType = 1 //上传方式（本地上传为0）
    }

    // 解析
    parse() {
        return new Promise((resolve, reject) => {
            const filePath = `${BOOK_PATH}/${this.path}`
            if (!this.path || !fs.existsSync(filePath)) {
                reject(new Error('电子书路径不存在'))
            }
            const epub = new Epub(filePath)
            epub.on('error', err => {
                reject(err)
            })
            epub.on('end', err => {
                if (err) {
                    reject(err)
                } else {
                    //console.log(epub.metadata)
                    let {
                        title,
                        creator,
                        language,
                        cover,
                        publisher,
                        creatorFileAs
                    } = epub.metadata
                    if (!title) {
                        reject(new Error('标题为空'))
                    } else {
                        this.title = title
                        this.language = language || 'en'
                        this.author = creator || creatorFileAs || 'unknown'
                        this.rootFile = epub.rootFile
                        this.publisher = publisher || 'unknown'
                        const handleGetImage = (error, imgBuffer, mimeType) => {
                            if (error) {
                                reject(error)
                            } else {
                                const suffix = mimeType.split('/')[1] //封面的文件类型
                                const coverPath = `${BOOK_PATH}/imageTest/${this.fileName}.${suffix}` //封面的存储路径
                                const coverUrl = `${BOOK_URL}/imageTest/${this.fileName}.${suffix}` //封面的下载地址
                                fs.writeFileSync(coverPath, imgBuffer, {
                                    encoding: "binary"
                                })
                                this.coverPath = `/imageTest/${this.fileName}.${suffix}`
                                this.cover = coverUrl
                                resolve(this)
                            }
                        }
                        try {
                            this.unzip()
                            this.parseContents(epub).then(({chapters, chapterTree}) => {
                                this.contents = chapters
                                this.contentsTree = chapterTree
                                //console.log('chapters:',chapters)
                                //console.log('chapterTree:',chapterTree)
                                epub.getImage(cover, handleGetImage)
                            }).catch(err => {
                                reject(err)
                            })
                        } catch (e) {
                            reject(e)
                        }
                    }
                }
            })
            epub.parse()
            this.epub = epub
        })
    }

    //解压文件
    unzip() {
        const AdmZip = require('adm-zip')
        const zip = new AdmZip(Book.getPath(this.path)) //解析文件路径
        zip.extractAllTo(
            Book.getPath(this.unzipPath),
            true
        )
    }

    //电子书目录解析函数
    parseContents(epub) {

        //获取OEBPS文件夹下的.ncx文件
        function getNcxFilePath() {
            const manifest = epub && epub.manifest
            const spine = epub && epub.spine
            const ncx = manifest && manifest.ncx
            const toc = spine && spine.toc
            return (ncx && ncx.href) || (toc && toc.href)
        }


        /*
        *  将目录转为一维数组
        * */
        function flatten(array) {
            return [].concat(...array.map(item => {
                if (item.navPoint && item.navPoint.length) {
                    return [].concat(item, ...flatten(item.navPoint))
                } else if (item.navPoint) {
                    return [].concat(item, item.navPoint)
                } else {
                    return item
                }
            }))
        }

        /*
        *  查询当前目录的父级目录及规定层次
        * */
        function findParent(array, level = 0, pid = '') {
            return array.map(item => {
                item.level = level
                item.pid = pid
                if (item.navPoint && item.navPoint.length) {
                    item.navPoint = findParent(item.navPoint, level + 1, item['$'].id)
                } else if (item.navPoint) {
                    item.navPoint.level = level + 1
                    item.navPoint.pid = item['$'].id
                }
                return item
            })
        }

        if (!this.rootFile) {
            throw new Error('目录解析失败')
        } else {
            const fileName = this.fileName
            return new Promise((resolve, reject) => {
                const ncxFilePath = Book.getPath(`${this.unzipPath}/${getNcxFilePath()}`)  //获取ncx文件路径
                //读取OEBPS文件夹下的xxx.ncx文件内容
                const xml = fs.readFileSync(ncxFilePath, {
                    encoding: "utf-8"
                })
                //解析xml文件 将ncx文件从xml转为json
                xml2js(xml, {
                    explicitArray: false,  //false时，解析结果不会包裹Array
                    ignoreAttrs: false  //解析属性
                }, function (err, json) {
                    if (!err) {
                        const navMap = json.ncx.navMap //获取ncx的navMap属性
                        //如果navMap属性存在navPoint属性，则说明目录存在
                        if (navMap.navPoint) {
                            navMap.navPoint = findParent(navMap.navPoint)
                            const newNavMap = flatten(navMap.navPoint)  //将目录拆分为扁平结构
                            const chapters = []
                            //console.log(newNavMap[0])
                            //遍历epub解析出的目录(或者遍历epub.flow)
                            newNavMap.forEach((chapter, index) => {
                                //对应章节的下载路径
                                chapter.text = `${BOOK_URL}/unzipTest/${fileName}/OEBPS/${chapter.content['$'].src}`
                                //从ncx文件中解析出目录的标题
                                if (chapter && chapter.navLabel) {
                                    chapter.label = chapter.navLabel.text || ''
                                } else {
                                    chapter.label = ''
                                }
                                chapter.navId = chapter['$'].id
                                chapter.fileName = fileName
                                chapter.order = index + 1
                                chapters.push(chapter)
                            })
                            const chapterTree = []
                            chapters.forEach(item => {
                                item.children = []
                                if (item.pid === '') {
                                    chapterTree.push(item)
                                } else {
                                    const parent = chapters.find(item_1 => item_1.navId === item.pid)
                                    parent.children.push(item)
                                }
                            }) //将目录转化为树状结构
                            resolve({chapters, chapterTree})
                        } else {
                            reject(new Error('目录解析失败'))
                        }
                    } else {
                        reject(err)
                    }
                })
            })
        }
    }

    //保存到数据库的数据
    createBookFromData(data) {
        //console.log(data)
        this.fileName = data.fileName //文件名
        this.path = data.path || data.filePath //epub文件路径
        this.filePath = data.path || data.filePath //epub文件路径
        this.url = data.url //epub文件下载路径
        this.title = data.title //标题
        this.author = data.author //作者
        this.publisher = data.publisher //出版社
        this.cover = data.cover //封面图片URL
        this.coverPath = data.coverPath //封面图片路径
        this.category = data.category //分类ID
        this.categoryTest = data.categoryText //分类名称
        this.language = data.language //语言
        this.unzipPath = data.unzipPath //解压后的相对目录路径
        this.unzipUrl = data.unzipUrl //解压后电子书的下载地址
        this.originalName = data.originalName //电子书的源文件名（原名）
        this.contentsTree = data.contentsTree || [] //目录树
        this.contents = data.contents || [] //目录数组（一维数组）
        this.rootFile = data.rootFile  //根文件名
        this.createUser = data.username //上传用户
        this.updateType = data.updateType || 1 //上传方式
    }

    //获取表book所包括的属性
    getBook() {
        return {
            fileName: this.fileName,
            cover: this.cover,
            title: this.title,
            author: this.author,
            publisher: this.publisher,
            bookId: this.fileName,
            category: this.category,
            categoryText: this.categoryText || '自定义',
            language: this.language,
            rootFile: this.rootFile,
            originalName: this.originalName,
            filePath: this.filePath,
            unzipPath: this.unzipPath,
            coverPath: this.coverPath,
            createUser: this.createUser,
            updateDt: new Date().valueOf(),
            createDt: new Date().valueOf(),
            updateType: this.updateType || 1
        }
    }

    //获取表contents数据
    getContents(){
        const arr_contents = this.contents.map(item => {
            const {
                fileName,
                order,
                level,
                text,
                label,
                pid,
                navId
            } =  item
            const href = text.replace(`${BOOK_URL}/unzipTest/${fileName}/`,'')
            const id = href.replace('OEBPS/','').replace('.html','')
            return {
                fileName,
                id ,
                href,
                order,
                level,
                text,
                label,
                pid,
                navId
            }
        })
        return arr_contents
    }

    //删除电子书
    reset(){
        if (fs.existsSync(`${BOOK_PATH}${this.filePath}`)) {
            try{
                fs.unlinkSync(`${BOOK_PATH}${this.filePath}`)
            } catch (e) {
                throw new Error(e)
            }
        }
        if (fs.existsSync(`${BOOK_PATH}${this.coverPath}`)){
            try{
                fs.unlinkSync(`${BOOK_PATH}${this.coverPath}`)
            } catch (e) {
                throw new Error(e)
            }
        }
        if (fs.existsSync(`${BOOK_PATH}${this.unzipPath}`)) {
            try{
                fs.rmdirSync(`${BOOK_PATH}${this.unzipPath}`, { recursive: true})
            } catch (e) {
                throw new Error(e)
            }
        }
    }

    //通过contents获取contentsTree
    makeContentsTree(){
        this.contents.forEach(item => {
            item.children = []
            if (item.pid === '') {
                this.contentsTree.push(item)
            } else {
                const content = this.contents.find(value => value.navId === item.pid)
                content.children.push(item)
            }
        })
    }
}

module.exports = Book
