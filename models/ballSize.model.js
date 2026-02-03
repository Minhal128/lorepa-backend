const mongoose = require("mongoose");

const BallSizeSchema = new mongoose.Schema({
  title: String,
});

module.exports = mongoose.model("BallSize", BallSizeSchema);
