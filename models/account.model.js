const mongoose = require("mongoose");

const AccountSchema = mongoose.Schema({
  email: { type: String, required: true },
  password: { type: String, required: true },
  name: { type: String, required: true },
  phone: { type: String, required: true },
  profilePicture: { type: String, default: "" },
  kycVerified: { type: Boolean, default: false },
  address: { type: String, default: "" },
  state: { type: String, default: "" },
  country: { type: String, default: "" },
  street: { type: String, default: "" },

  licenseFrontImage: { type: String, default: "" },
  licenseBackImage: { type: String, default: "" },
  carInsurancePolicyImage: { type: String, default: "" },
  trailerInsurancePolicyImage: { type: String, default: "" },
  trailerRegistrationImage: { type: String, default: "" },
  role: { type: String, enum: ["owner", "renter"], required: true },
  accountBlocked: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },

  otp: { type: Number, default: null },
  otpVerified: { type: Boolean, default: false },
  googleId: { type: String, default: null },
  isGoogleLogin: { type: Boolean, default: false },
});

const AccountModel = mongoose.model("Account", AccountSchema, "Account");
module.exports = { AccountModel };
