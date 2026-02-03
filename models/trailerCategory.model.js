const mongoose = require("mongoose");

const TrailerSchema = new mongoose.Schema({
  title: { type: String, required: false,default:null },
  image: { type: String, required: true },
});

const TrailerCategoryModel = mongoose.model("TrailerCategory", TrailerSchema);
module.exports = { TrailerCategoryModel };
