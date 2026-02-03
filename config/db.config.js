const mongoose = require("mongoose")
require("dotenv").config()


const dbConnection = async () => {
    try {
        let result = await mongoose.connect(process.env.MONGO_URL);
        if (result) { console.log('Database Connected') }
        else { console.log('Database Not Connected') }
    }
    catch (error) {
        console.log(error)
    }
}


module.exports = dbConnection