const mongoose = require("mongoose");

const TrustedBySchema = new mongoose.Schema({
  image: { type: String, required: true },
});

const TrustedByModel = mongoose.model("TrustedBy", TrustedBySchema);
module.exports = { TrustedByModel };
