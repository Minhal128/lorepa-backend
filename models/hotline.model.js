const mongoose = require("mongoose");

const hotlineSchema = new mongoose.Schema({
    email: { type: String, required: true },
    branches: { type: Array, default:[]},
    US_Customer_Service: { type: Array, default:[]},
    Ph_Customer_Service: { type: Array, default:[]},
    Ph_Landline: { type: Array, default:[]},
});

const HotlineModel = mongoose.model("Hotline", hotlineSchema, "Hotline");

module.exports = { HotlineModel };
