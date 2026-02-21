const express = require("express")
const cors = require("cors")
const http = require("http")
const { Server } = require("socket.io")
const dbConnection = require("./config/db.config")
const combineRouter = require("./routers/index")
const axios = require("axios")
const Message = require("./models/message.model")
const stripeRouter = require("./routers/stripe.router");
require("dotenv").config()

const app = express()
const port = process.env.PORT || 3002

app.use(express.json())
app.use(cors({ origin: [process.env.FRONTEND_URL, "https://lorepa.ca", "https://clownfish-app-aaokq.ondigitalocean.app", "https://lorepa-seven.vercel.app", "http://localhost:3000", "http://localhost:5173"], credentials: true }))
app.use("/api/v1", combineRouter)

dbConnection()

const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY || 'AIzaSyASUc7l3wvJlyJXs2R_P2nEH17iIO8aicU'
app.get('/api/autocomplete', async (req, res) => {
  try {
    const { input } = req.query
    if (!input) return res.json({ status: "ZERO_RESULTS", predictions: [] });

    const response = await axios.get(
      'https://maps.googleapis.com/maps/api/place/autocomplete/json',
      { params: { input, key: GOOGLE_API_KEY, language: 'en' } }
    )
    return res.json(response.data)
  } catch (err) {
    console.error('Autocomplete Error:', err.response?.data || err.message);
    res.status(500).json({ error: 'Error fetching autocomplete', details: err.message })
  }
})

app.get('/api/place-details', async (req, res) => {
  try {
    const { placeId } = req.query;
    if (!placeId) return res.status(400).json({ error: "placeId is required" });

    const response = await axios.get(
      'https://maps.googleapis.com/maps/api/place/details/json',
      {
        params: {
          place_id: placeId,
          key: GOOGLE_API_KEY,
          fields: 'geometry,address_component'
        }
      }
    );

    res.json(response.data);
  } catch (err) {
    console.error('Place Details Error:', err.response?.data || err.message);
    res.status(500).json({ error: 'Error fetching place details', details: err.message });
  }
});


// Helper: extract city/state/country from Google address_components
const extractFromGoogleComponents = (components) => {
  let city = "", country = "", state = "", stateShort = "";
  const get = (types) => components.find(c => types.some(t => c.types.includes(t)));
  const locality = get(["locality"]);
  const subloc = get(["sublocality_level_1", "sublocality"]);
  const admin2 = get(["administrative_area_level_2"]);
  const admin1 = get(["administrative_area_level_1"]);
  const countryComp = get(["country"]);
  city = locality?.long_name || subloc?.long_name || admin2?.long_name || admin1?.long_name || "";
  if (admin1) { state = admin1.long_name; stateShort = admin1.short_name; }
  if (countryComp) country = countryComp.long_name;
  return { city, country, state: stateShort || state };
};

// Helper: reverse geocode via Nominatim (OSM) - free, no key required
const nominatimReverseGeocode = async (lat, lng) => {
  const response = await axios.get('https://nominatim.openstreetmap.org/reverse', {
    params: { format: 'json', lat, lon: lng, 'accept-language': 'en', zoom: 10 },
    headers: { 'User-Agent': 'LorepaApp/1.0' },
    timeout: 5000,
  });
  if (!response.data || response.data.error) return null;
  const addr = response.data.address || {};
  return {
    city: addr.city || addr.town || addr.village || addr.suburb || addr.county || "",
    state: addr.state || addr.region || "",
    country: addr.country || "",
    formatted_address: response.data.display_name || "",
  };
};

app.get('/api/reverse-geocode', async (req, res) => {
  try {
    const { lat, lng } = req.query;
    if (!lat || !lng) return res.status(400).json({ error: "lat and lng are required" });

    let city = "", country = "", state = "", formatted_address = "";

    // 1. Try Google Geocoding API
    try {
      const response = await axios.get(
        'https://maps.googleapis.com/maps/api/geocode/json',
        { params: { latlng: `${lat},${lng}`, key: GOOGLE_API_KEY, language: 'en' }, timeout: 5000 }
      );
      if (response.data.status === 'OK' && response.data.results.length > 0) {
        const result = response.data.results[0];
        const extracted = extractFromGoogleComponents(result.address_components);
        city = extracted.city;
        country = extracted.country;
        state = extracted.state;
        formatted_address = result.formatted_address;
      }
    } catch (googleErr) {
      console.warn('Google Geocode failed, falling back to Nominatim:', googleErr.message);
    }

    // 2. Fallback to Nominatim if Google failed or returned empty city
    if (!city) {
      try {
        const nom = await nominatimReverseGeocode(lat, lng);
        if (nom && nom.city) {
          city = nom.city;
          if (!country) country = nom.country;
          if (!state) state = nom.state;
          if (!formatted_address) formatted_address = nom.formatted_address;
        } else if (nom) {
          if (!country) country = nom.country;
          if (!state) state = nom.state;
          if (!formatted_address) formatted_address = nom.formatted_address;
        }
      } catch (nomErr) {
        console.warn('Nominatim fallback failed:', nomErr.message);
      }
    }

    if (city || country) {
      return res.json({
        status: "OK",
        city,
        country,
        state,
        formatted_address: formatted_address || `${city}${state ? ', ' + state : ''}, ${country}`,
        lat: parseFloat(lat),
        lng: parseFloat(lng),
      });
    }

    return res.json({ status: "ZERO_RESULTS" });
  } catch (err) {
    console.error('Reverse Geocode Error:', err.response?.data || err.message);
    res.status(500).json({ error: 'Error fetching reverse geocode', details: err.message });
  }
});

app.use("/api/v1/stripe", stripeRouter);

const server = http.createServer(app)
const io = new Server(server, {
  cors: { origin: "*" }
})
app.set("io", io)

io.on("connection", (socket) => {
  console.log("User connected:", socket.id)

  socket.on("joinChat", (chatId) => {
    socket.join(chatId)
  })

  // Renamed to broadcastMessage to prevent duplicate DB creation.
  // The client will save via REST /chat/send first, then emit broadcastMessage
  socket.on("broadcastMessage", (message) => {
    try {
      // Broadcast the fully populated message to the room
      io.to(message.chatId).emit("receiveMessage", message)
    } catch (err) {
      console.error("Socket broadcastMessage error:", err)
    }
  })

  // Typing indicators
  socket.on("typing", ({ chatId, userId }) => {
    socket.to(chatId).emit("userTyping", { chatId, userId })
  })

  socket.on("stopTyping", ({ chatId, userId }) => {
    socket.to(chatId).emit("userStoppedTyping", { chatId, userId })
  })

  // Mark message as read
  socket.on("markAsRead", async ({ messageId, chatId, userId }) => {
    try {
      // Add userId to readBy array if not already present
      const message = await Message.findByIdAndUpdate(
        messageId,
        { $addToSet: { readBy: userId } },
        { new: true }
      ).populate("sender", "name _id")

      if (message) {
        io.to(chatId).emit("messageRead", message)
      }
    } catch (err) {
      console.error("Socket markAsRead error:", err)
    }
  })

  // Mark ALl messages in chat as read for a user
  socket.on("markChatAsRead", async ({ chatId, userId }) => {
    try {
      // Find messages in this chat NOT sent by this user, and add userId to readBy
      await Message.updateMany(
        { chatId, sender: { $ne: userId } },
        { $addToSet: { readBy: userId } }
      )
      io.to(chatId).emit("chatRead", { chatId, userId })
    } catch (err) {
      console.error("Socket markChatAsRead error:", err)
    }
  })

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id)
  })
})

server.listen(port, () => {
  console.log(`Server running on port ${port}`)
})
