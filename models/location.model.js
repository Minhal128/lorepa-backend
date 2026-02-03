const mongoose = require("mongoose");

const LocationSchema = new mongoose.Schema({
  title: { type: String, required: false,default:null },
  image: { type: String, required: true },
});

const LocationModel = mongoose.model("Location", LocationSchema);
module.exports = { LocationModel };
