const router = require("express").Router();
const Stripe = require("stripe");
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
// Note: Ensure STRIPE_SECRET_KEY is set in your environment variables (e.g., Vercel, .env)
// Live Stripe publishable key: pk_live_51OoztADjwbwblMMWanIsTlt7LdTDacdO0jw6JnOTNSnfT7aWiIHHxHAXLdSd0MsVWVvfRq4IK3jBuPJoKfxXv5Uq00d8plKYxb

router.post("/create-checkout-session", async (req, res) => {
  try {
    const { trailerId, userId, startDate, endDate, price } = req.body;

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: "Trailer Booking",
              description: `Booking trailer for ${startDate} to ${endDate}`,
            },
            unit_amount: Math.round(price * 100),
          },
          quantity: 1,
        },
      ],
      mode: "payment",

      //   success_url: `http://localhost:5173/payment-success?trailerId=${trailerId}&price=${price}&start=${startDate}&end=${endDate}&user=${userId}&session_id={CHECKOUT_SESSION_ID}`,
      //   cancel_url: `http://localhost:5173/payment-cancel`,
      success_url: `https://lorepa.ca/payment-success?trailerId=${trailerId}&price=${price}&start=${startDate}&end=${endDate}&user=${userId}&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `https://lorepa.ca/payment-cancel`,
    });

    return res.json({ url: session.url });
  } catch (err) {
    console.log(err);
    res.status(500).json({ msg: "Stripe error" });
  }
});

module.exports = router;
