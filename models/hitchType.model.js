const mongoose = require("mongoose");

const HitchTypeSchema = new mongoose.Schema({
  title: String,
});

module.exports = mongoose.model("HitchType", HitchTypeSchema);
