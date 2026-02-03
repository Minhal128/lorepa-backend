const { TrustedByModel } = require("../models/trustedBy.model");
const { LocationModel } = require("../models/location.model");
const { FaqModel } = require("../models/faq.model");
const { uploadFile } = require("../utils/function");
const { TrailerCategoryModel } = require("../models/trailerCategory.model");
const SecurityDeposit = require("../models/securityDeposit.model");
const Category = require("../models/category.model");
const TrailerStatus = require("../models/trailerStatus.model");
const HitchType = require("../models/hitchType.model");
const BallSize = require("../models/ballSize.model");

// --- TRUSTED BY ---
const getAllTrustedBy = async (req, res) => {
  try {
    const data = await TrustedByModel.find();
    res.status(200).json({ data, code: 200 });
  } catch (err) {
    res.status(500).json({ msg: "Server error" });
  }
};

const createTrustedBy = async (req, res) => {
  try {
    const fileUrl = await uploadFile(req.file);
    const data = await TrustedByModel.create({ image: fileUrl });
    res.status(201).json({ data, msg: "TrustedBy added", code: 201 });
  } catch (err) {
    res.status(500).json({ msg: "Server error" });
  }
};

const deleteTrustedBy = async (req, res) => {
  try {
    await TrustedByModel.findByIdAndDelete(req.params.id);
    res.status(200).json({ msg: "TrustedBy deleted", code: 200 });
  } catch (err) {
    res.status(500).json({ msg: "Server error" });
  }
};

// --- LOCATIONS ---
const getAllLocations = async (req, res) => {
  try {
    const data = await LocationModel.find();
    res.status(200).json({ data, code: 200 });
  } catch (err) {
    res.status(500).json({ msg: "Server error" });
  }
};

const createLocation = async (req, res) => {
  try {
    const { title } = req.body;
    const fileUrl = await uploadFile(req.file);
    const data = await LocationModel.create({ title, image: fileUrl });
    res.status(201).json({ data, msg: "Location added", code: 201 });
  } catch (err) {
    res.status(500).json({ msg: "Server error" });
  }
};

const deleteLocation = async (req, res) => {
  try {
    await LocationModel.findByIdAndDelete(req.params.id);
    res.status(200).json({ msg: "Location deleted", code: 200 });
  } catch (err) {
    res.status(500).json({ msg: "Server error" });
  }
};

// --- TRAILERS ---
const getAllTrailers = async (req, res) => {
  try {
    const data = await TrailerCategoryModel.find();
    res.status(200).json({ data, code: 200 });
  } catch (err) {
    res.status(500).json({ msg: "Server error" });
  }
};

const createTrailer = async (req, res) => {
  try {
    const { title } = req.body;
    const fileUrl = await uploadFile(req.file);
    const data = await TrailerCategoryModel.create({ title, image: fileUrl });
    res.status(201).json({ data, msg: "Trailer added", code: 201 });
  } catch (err) {
    res.status(500).json({ msg: "Server error" });
  }
};

const deleteTrailer = async (req, res) => {
  try {
    await TrailerCategoryModel.findByIdAndDelete(req.params.id);
    res.status(200).json({ msg: "Trailer deleted", code: 200 });
  } catch (err) {
    res.status(500).json({ msg: "Server error" });
  }
};

// --- FAQ ---
const getAllFaqs = async (req, res) => {
  try {
    const data = await FaqModel.find();
    res.status(200).json({ data, code: 200 });
  } catch (err) {
    res.status(500).json({ msg: "Server error" });
  }
};

const createFaq = async (req, res) => {
  try {
    const { question, answer, type } = req.body;
    const data = await FaqModel.create({ question, answer, type });
    res.status(201).json({ data, msg: "FAQ added", code: 201 });
  } catch (err) {
    res.status(500).json({ msg: "Server error" });
  }
};

const deleteFaq = async (req, res) => {
  try {
    await FaqModel.findByIdAndDelete(req.params.id);
    res.status(200).json({ msg: "FAQ deleted", code: 200 });
  } catch (err) {
    res.status(500).json({ msg: "Server error" });
  }
};
// SECURITY DEPOSIT 

const getAllSecurityDeposits = async (req, res) => {
  try {
    const data = await SecurityDeposit.find();
    res.status(200).json({ data, code: 200 });
  } catch {
    res.status(500).json({ msg: "Server error" });
  }
};

const createSecurityDeposit = async (req, res) => {
  try {
    const { title, amount } = req.body;
    const data = await SecurityDeposit.create({ title, amount });
    res.status(201).json({ data, msg: "Security Deposit added", code: 201 });
  } catch {
    res.status(500).json({ msg: "Server error" });
  }
};

const updateSecurityDeposit = async (req, res) => {
  try {
    const { title, amount } = req.body;
    const data = await SecurityDeposit.findByIdAndUpdate(req.params.id, { title, amount }, { new: true });
    res.status(200).json({ data, msg: "Security Deposit updated", code: 200 });
  } catch {
    res.status(500).json({ msg: "Server error" });
  }
};

const deleteSecurityDeposit = async (req, res) => {
  try {
    await SecurityDeposit.findByIdAndDelete(req.params.id);
    res.status(200).json({ msg: "Security Deposit deleted", code: 200 });
  } catch {
    res.status(500).json({ msg: "Server error" });
  }
};

// CATEGORY 

const getAllCategories = async (req, res) => {
  try {
    const data = await Category.find();
    res.status(200).json({ data, code: 200 });
  } catch {
    res.status(500).json({ msg: "Server error" });
  }
};

const createCategory = async (req, res) => {
  try {
    const { title } = req.body;
    const data = await Category.create({ title });
    res.status(201).json({ data, msg: "Category added", code: 201 });
  } catch {
    res.status(500).json({ msg: "Server error" });
  }
};

const updateCategory = async (req, res) => {
  try {
    const { title } = req.body;
    const data = await Category.findByIdAndUpdate(req.params.id, { title }, { new: true });
    res.status(200).json({ data, msg: "Category updated", code: 200 });
  } catch {
    res.status(500).json({ msg: "Server error" });
  }
};

const deleteCategory = async (req, res) => {
  try {
    await Category.findByIdAndDelete(req.params.id);
    res.status(200).json({ msg: "Category deleted", code: 200 });
  } catch {
    res.status(500).json({ msg: "Server error" });
  }
};

// Trailer Status
const getAllTrailerStatuses = async (req, res) => {
  try {
    const data = await TrailerStatus.find();
    res.status(200).json({ data, code: 200 });
  } catch {
    res.status(500).json({ msg: "Server error" });
  }
};

const createTrailerStatus = async (req, res) => {
  try {
    const { title } = req.body;
    const data = await TrailerStatus.create({ title });
    res.status(201).json({ data, msg: "Trailer status added", code: 201 });
  } catch {
    res.status(500).json({ msg: "Server error" });
  }
};

const updateTrailerStatus = async (req, res) => {
  try {
    const { title } = req.body;
    const data = await TrailerStatus.findByIdAndUpdate(req.params.id, { title }, { new: true });
    res.status(200).json({ data, msg: "Trailer status updated", code: 200 });
  } catch {
    res.status(500).json({ msg: "Server error" });
  }
};

const deleteTrailerStatus = async (req, res) => {
  try {
    await TrailerStatus.findByIdAndDelete(req.params.id);
    res.status(200).json({ msg: "Trailer status deleted", code: 200 });
  } catch {
    res.status(500).json({ msg: "Server error" });
  }
};

// HitchType
const getAllHitchTypes = async (req, res) => {
  try {
    const data = await HitchType.find();
    res.status(200).json({ data, code: 200 });
  } catch {
    res.status(500).json({ msg: "Server error" });
  }
};

const createHitchType = async (req, res) => {
  try {
    const { title } = req.body;
    const data = await HitchType.create({ title });
    res.status(201).json({ data, msg: "Hitch type added", code: 201 });
  } catch {
    res.status(500).json({ msg: "Server error" });
  }
};

const updateHitchType = async (req, res) => {
  try {
    const { title } = req.body;
    const data = await HitchType.findByIdAndUpdate(req.params.id, { title }, { new: true });
    res.status(200).json({ data, msg: "Hitch type updated", code: 200 });
  } catch {
    res.status(500).json({ msg: "Server error" });
  }
};

const deleteHitchType = async (req, res) => {
  try {
    await HitchType.findByIdAndDelete(req.params.id);
    res.status(200).json({ msg: "Hitch type deleted", code: 200 });
  } catch {
    res.status(500).json({ msg: "Server error" });
  }
};


//BALL SIZE
const getAllBallSizes = async (req, res) => {
  try {
    const data = await BallSize.find();
    res.status(200).json({ data, code: 200 });
  } catch {
    res.status(500).json({ msg: "Server error" });
  }
};

const createBallSize = async (req, res) => {
  try {
    const { title } = req.body;
    const data = await BallSize.create({ title });
    res.status(201).json({ data, msg: "Ball size added", code: 201 });
  } catch {
    res.status(500).json({ msg: "Server error" });
  }
};

const updateBallSize = async (req, res) => {
  try {
    const { title } = req.body;
    const data = await BallSize.findByIdAndUpdate(req.params.id, { title }, { new: true });
    res.status(200).json({ data, msg: "Ball size updated", code: 200 });
  } catch {
    res.status(500).json({ msg: "Server error" });
  }
};

const deleteBallSize = async (req, res) => {
  try {
    await BallSize.findByIdAndDelete(req.params.id);
    res.status(200).json({ msg: "Ball size deleted", code: 200 });
  } catch {
    res.status(500).json({ msg: "Server error" });
  }
};

module.exports = {
  getAllHitchTypes,
  createHitchType,
  updateHitchType,
  deleteHitchType,
  getAllBallSizes,
  createBallSize,
  updateBallSize,
  deleteBallSize,
  getAllTrustedBy,
  createTrustedBy,
  deleteTrustedBy,
  getAllLocations,
  createLocation,
  deleteLocation,
  getAllTrailers,
  createTrailer,
  deleteTrailer,
  getAllFaqs,
  createFaq,
  deleteFaq,
  getAllSecurityDeposits,
  createSecurityDeposit,
  updateSecurityDeposit,
  deleteSecurityDeposit,
  getAllCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  getAllTrailerStatuses,
  updateTrailerStatus,
  deleteTrailerStatus,
  createTrailerStatus,

};
