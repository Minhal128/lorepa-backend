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


app.get('/api/reverse-geocode', async (req, res) => {
  try {
    const { lat, lng } = req.query;
    if (!lat || !lng) return res.status(400).json({ error: "lat and lng are required" });

    const response = await axios.get(
      'https://maps.googleapis.com/maps/api/geocode/json',
      { params: { latlng: `${lat},${lng}`, key: GOOGLE_API_KEY, language: 'en' } }
    );

    if (response.data.status === 'OK' && response.data.results.length > 0) {
      const result = response.data.results[0];
      let city = "";
      let country = "";
      let state = "";
      let stateShort = "";

      result.address_components.forEach((c) => {
        if (c.types.includes("locality")) city = c.long_name;
        if (!city && c.types.includes("sublocality_level_1")) city = c.long_name;
        if (!city && c.types.includes("administrative_area_level_2")) city = c.long_name;
        if (!city && c.types.includes("administrative_area_level_1")) city = c.long_name;
        if (c.types.includes("administrative_area_level_1")) { state = c.long_name; stateShort = c.short_name; }
        if (c.types.includes("country")) country = c.long_name;
      });

      return res.json({
        status: "OK",
        city,
        country,
        state: stateShort || state,
        formatted_address: result.formatted_address,
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

  socket.on("sendMessage", async ({ chatId, sender, content }) => {
    try {
      const message = await Message.create({ chatId, sender, content })
      const populatedMessage = await Message.findById(message._id).populate("sender", "name _id")
      io.to(chatId).emit("receiveMessage", populatedMessage)
    } catch (err) {
      console.error("Socket sendMessage error:", err)
    }
  })

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id)
  })
})

server.listen(port, () => {
  console.log(`Server running on port ${port}`)
})
