const { TrailerModel } = require("../models/trailer.model");
const { uploadFile } = require("../utils/function");
const { createNotification } = require("./notification.service");

const create = async (req, res) => {
  try {
    const {
      latitude,
      longitude,
      userId,
      title,
      category,
      description,
      zip,
      dailyRate,
      city,
      country,
      closedDates,
      hitchType,
      lightPlug,
      weightCapacity,
      make,
      model,
      year,
      length,
      ballSize,
      dimensions,
      state,

    } = req.body;
    const files = req.files;
    if (!files || files.length === 0) {
      return res.status(400).json({ msg: "At least 1 image is required" });
    }
    if (files.length > 10) {
      return res.status(400).json({ msg: "Maximum 10 images allowed" });
    }

    let imageUrls;
    let uploadWarning = null;
    try {
      imageUrls = await Promise.all(files.map((file) => uploadFile(file)));
    } catch (uploadErr) {
      console.error("Image upload failed:", uploadErr);
      const placeholder = `https://placehold.co/800x600?text=No+Image`;
      imageUrls = files.map(() => placeholder);
      uploadWarning = uploadErr.message || "Image upload failed, using placeholders";
    }

    const trailer = await TrailerModel.create({
      userId, title, category, description, images: imageUrls,
      latitude, longitude, city, country, state, zip, dailyRate,
      closedDates, hitchType, lightPlug, weightCapacity,
      make, model, year, length, ballSize, dimensions,
    });

    await createNotification({
      userId,
      title: "Trailer Listing Submitted",
      description: "Your trailer listing request has been sent to the admin for approval."
    });

    const resp = { msg: "Trailer created successfully", data: trailer, status: 200 };
    if (uploadWarning) resp.uploadWarning = uploadWarning;
    return res.status(200).json(resp);
  } catch (err) {
    console.error(err);
    return res
      .status(500)
      .json({ msg: "Something went wrong", error: err.message });
  }
};
const getAll = async (req, res) => {
  try {
    const trailers = await TrailerModel.find().populate("userId");
    res.status(200).json({ data: trailers });
  } catch (err) {
    res.status(500).json({ msg: "Error fetching trailers" });
  }
};
const getAllApproved = async (req, res) => {
  try {
    const trailers = await TrailerModel.find({ status: { $regex: /^approved$/i } }).populate("userId");
    res.status(200).json({ data: trailers });
  } catch (err) {
    res.status(500).json({ msg: "Error fetching trailers" });
  }
};

// Search trailers with improved location filtering
const searchTrailers = async (req, res) => {
  try {
    const { location, category, minPrice, maxPrice, sortBy } = req.query;

    let query = { status: { $regex: /^approved$/i } };

    // Simplified Location Search: search for any of the terms anywhere in city/state/country
    if (location) {
      const parts = location.trim().split(/[,\s]+/).filter(p => p.length >= 2);

      if (parts.length > 0) {
        query.$and = parts.map(part => ({
          $or: [
            { city: { $regex: part, $options: 'i' } },
            { state: { $regex: part, $options: 'i' } },
            { country: { $regex: part, $options: 'i' } }
          ]
        }));
      }
      console.log('Search location parts:', parts);
    }

    // Category filter
    if (category) {
      query.category = new RegExp(category.trim(), 'i');
    }

    // Price range filter
    if (minPrice || maxPrice) {
      query.dailyRate = {};
      if (minPrice) query.dailyRate.$gte = parseFloat(minPrice);
      if (maxPrice) query.dailyRate.$lte = parseFloat(maxPrice);
    }

    let trailersQuery = TrailerModel.find(query).populate("userId");

    // Sorting
    if (sortBy) {
      switch (sortBy) {
        case 'price_asc':
          trailersQuery = trailersQuery.sort({ dailyRate: 1 });
          break;
        case 'price_desc':
          trailersQuery = trailersQuery.sort({ dailyRate: -1 });
          break;
        case 'newest':
          trailersQuery = trailersQuery.sort({ createdAt: -1 });
          break;
        case 'oldest':
          trailersQuery = trailersQuery.sort({ createdAt: 1 });
          break;
        default:
          trailersQuery = trailersQuery.sort({ createdAt: -1 });
      }
    } else {
      trailersQuery = trailersQuery.sort({ createdAt: -1 });
    }

    const trailers = await trailersQuery;

    console.log('Search results count:', trailers.length);
    if (trailers.length > 0) {
      console.log('Sample results:');
      trailers.slice(0, 3).forEach(trailer => {
        console.log(`- ${trailer.title}: ${trailer.city}, ${trailer.state}, ${trailer.country}`);
      });
    }

    res.status(200).json({ data: trailers, count: trailers.length });
  } catch (err) {
    console.error('Search error:', err);
    res.status(500).json({ msg: "Error searching trailers", error: err.message });
  }
};

// Debug endpoint to check location data
const debugLocations = async (req, res) => {
  try {
    const trailers = await TrailerModel.find({ status: { $regex: /^approved$/i } })
      .select('title city state country')
      .limit(20);

    const locationData = trailers.map(trailer => ({
      title: trailer.title,
      city: trailer.city,
      state: trailer.state,
      country: trailer.country,
      fullLocation: `${trailer.city}, ${trailer.state || 'N/A'}, ${trailer.country}`
    }));

    res.status(200).json({
      message: "Debug location data",
      count: locationData.length,
      data: locationData
    });
  } catch (err) {
    console.error('Debug error:', err);
    res.status(500).json({ msg: "Error getting debug data", error: err.message });
  }
};

// Get Single Trailer
const getSingle = async (req, res) => {
  try {
    const { id } = req.params;
    const trailer = await TrailerModel.findById(id).populate("userId");
    if (!trailer) return res.status(404).json({ msg: "Trailer not found" });
    res.status(200).json({ data: trailer });
  } catch (err) {
    res.status(500).json({ msg: "Error fetching trailer" });
  }
};
const getAllBySeller = async (req, res) => {
  try {
    const { id } = req.params;
    const trailer = await TrailerModel.find({ userId: id })
    if (!trailer) return res.status(404).json({ msg: "Trailer not found" });
    res.status(200).json({ data: trailer });
  } catch (err) {
    res.status(500).json({ msg: "Error fetching trailer" });
  }
};

// Delete Trailer
const remove = async (req, res) => {
  try {
    const { id } = req.params;
    await TrailerModel.findByIdAndDelete(id);
    res.status(200).json({ msg: "Trailer deleted" });
  } catch (err) {
    res.status(500).json({ msg: "Error deleting trailer" });
  }
};

// Change Status
const changeStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const updated = await TrailerModel.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    );
    if (updated) {
      await createNotification({
        userId: updated.userId,
        title: `Trailer ${status}`,
        description: `Your trailer "${updated.title}" status has been updated to ${status}.`
      });
      res.status(200).json({ msg: "Status updated", data: updated });

    }
  } catch (err) {
    res.status(500).json({ msg: "Error updating status" });
  }
};

const update = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      latitude,
      longitude,
      title,
      category,
      description,
      zip,
      dailyRate,
      depositRate,
      city,
      country,
      closedDates,
      existingImages, // array of image URLs to keep
      hitchType,
      lightPlug,
      weightCapacity,
      make,
      model,
      year,
      length,
      ballSize,
      dimensions,
      state
    } = req.body;

    const trailer = await TrailerModel.findById(id);
    if (!trailer) return res.status(404).json({ msg: "Trailer not found" });

    // Handle images
    let newImages = trailer.images || [];

    // Check both existingImages and existingImages[] (common multipart issue)
    const rawExisting = existingImages || req.body["existingImages[]"];

    if (rawExisting) {
      const normalizedExisting = Array.isArray(rawExisting) ? rawExisting : [rawExisting];
      newImages = newImages.filter(img => normalizedExisting.includes(img));
    } else {
      // If none provided, it means all existing images were removed
      newImages = [];
    }

    if (req.files && req.files.length > 0) {
      if (newImages.length + req.files.length > 10) {
        return res.status(400).json({ msg: "Maximum 10 images allowed" });
      }
      const uploaded = await Promise.all(req.files.map(file => uploadFile(file)));
      newImages = [...newImages, ...uploaded];
    }

    // Update trailer fields
    trailer.latitude = latitude ?? trailer.latitude;
    trailer.longitude = longitude ?? trailer.longitude;
    trailer.title = title ?? trailer.title;
    trailer.category = category ?? trailer.category;
    trailer.description = description ?? trailer.description;
    trailer.zip = zip ?? trailer.zip;
    trailer.dailyRate = dailyRate ?? trailer.dailyRate;
    trailer.depositRate = depositRate ?? trailer.depositRate;
    trailer.city = city ?? trailer.city;
    trailer.country = country ?? trailer.country;
    trailer.closedDates = closedDates ?? trailer.closedDates;
    trailer.images = newImages;

    // Update new fields
    trailer.hitchType = hitchType ?? trailer.hitchType;
    trailer.state = state ?? trailer.state;
    trailer.lightPlug = lightPlug ?? trailer.lightPlug;
    trailer.weightCapacity = weightCapacity ?? trailer.weightCapacity;
    trailer.make = make ?? trailer.make;
    trailer.model = model ?? trailer.model;
    trailer.year = year ?? trailer.year;
    trailer.length = length ?? trailer.length;
    trailer.ballSize = ballSize ?? trailer.ballSize;
    trailer.dimensions = dimensions ?? trailer.dimensions;

    await trailer.save();

    res.status(200).json({ msg: "Trailer updated successfully", data: trailer });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Something went wrong", error: err.message });
  }
};



module.exports = {
  create,
  getAll,
  getSingle,
  remove,
  changeStatus,
  getAllApproved,
  getAllBySeller,
  update,
  searchTrailers,
  debugLocations
};
