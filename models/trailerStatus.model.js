const mongoose = require("mongoose");

const TrailerStatusSchema = new mongoose.Schema({
  title: String,
});

module.exports = mongoose.model("TrailerStatus", TrailerStatusSchema);
