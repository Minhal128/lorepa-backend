const multer = require('multer')
const storage = multer.memoryStorage()

const multipleupload = multer({storage})


module.exports = {multipleupload}