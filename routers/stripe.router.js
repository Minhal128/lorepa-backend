const router = require("express").Router();
const Stripe = require("stripe");
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const { BookingModel } = require("../models/booking.model");
const { TrailerModel } = require("../models/trailer.model");
// Note: Ensure STRIPE_SECRET_KEY is set in your environment variables (e.g., Vercel, .env)
// Live Stripe publishable key: pk_live_51OoztADjwbwblMMWanIsTlt7LdTDacdO0jw6JnOTNSnfT7aWiIHHxHAXLdSd0MsVWVvfRq4IK3jBuPJoKfxXv5Uq00d8plKYxb

const SERVICE_FEE_RATE = 0.05;

router.post("/create-checkout-session", async (req, res) => {
  try {
    const { trailerId, userId, startDate, endDate, price, bookingId } = req.body;

    // Fetch the booking to get the authoritative rental price (prevent price tampering)
    let rentalPrice = parseFloat(price);
    if (bookingId) {
      const booking = await BookingModel.findById(bookingId);
      if (booking) {
        rentalPrice = booking.price;
      }
    }

    // Calculate service fee server-side for security
    const serviceFee = parseFloat((rentalPrice * SERVICE_FEE_RATE).toFixed(2));
    const totalWithFee = parseFloat((rentalPrice + serviceFee).toFixed(2));

    // For Accounts V2 compatibility in testmode, pre-create the customer explicitly
    const customer = await stripe.customers.create({
      metadata: { userId: userId || "", bookingId: bookingId || "" }
    });

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      locale: "fr",
      customer: customer.id,
      line_items: [
        {
          price_data: {
            currency: "cad",
            product_data: {
              name: "Location de remorque",
              description: `Location du ${startDate} au ${endDate}`,
            },
            unit_amount: Math.round(rentalPrice * 100),
          },
          quantity: 1,
        },
        {
          price_data: {
            currency: "cad",
            product_data: {
              name: "Frais de service Lorepa (5%)",
              description: "Frais de plateforme",
            },
            unit_amount: Math.round(serviceFee * 100),
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      // Save the payment method for the deposit pre-authorization hold after checkout
      payment_intent_data: {
        setup_future_usage: "off_session",
        metadata: { bookingId: bookingId || "" },
      },
      success_url: `${process.env.FRONTEND_URL || "https://lorepa.ca"}/payment-success?bookingId=${bookingId}&trailerId=${trailerId}&price=${totalWithFee}&start=${startDate}&end=${endDate}&user=${userId}&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.FRONTEND_URL || "https://lorepa.ca"}/payment-cancel`,
    });

    return res.json({ url: session.url });
  } catch (err) {
    console.log(err);
    res.status(500).json({ msg: "Stripe error" });
  }
});

// Create a pre-authorization hold for the security deposit after successful payment
router.post("/create-deposit-hold", async (req, res) => {
  try {
    const { bookingId, sessionId } = req.body;
    if (!bookingId || !sessionId) {
      return res.status(400).json({ msg: "bookingId and sessionId are required" });
    }

    const booking = await BookingModel.findById(bookingId).populate("trailerId");
    if (!booking) return res.status(404).json({ msg: "Booking not found" });

    const depositAmount = parseFloat(booking.trailerId?.depositRate || 0);
    if (depositAmount <= 0) {
      return res.json({ msg: "No deposit required for this trailer", depositStatus: "none" });
    }

    // Retrieve the Stripe checkout session to get the customer and payment method
    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ["payment_intent", "payment_intent.payment_method"],
    });

    const customerId = session.customer;
    const paymentMethod = session.payment_intent?.payment_method;
    const paymentMethodId = typeof paymentMethod === "string" ? paymentMethod : paymentMethod?.id;

    if (!customerId || !paymentMethodId) {
      return res.status(400).json({ msg: "Could not retrieve payment method from session" });
    }

    // Attach the payment method to the customer for off-session use
    try {
      await stripe.paymentMethods.attach(paymentMethodId, { customer: customerId });
    } catch (attachErr) {
      // Already attached — ignore this error
      if (attachErr.code !== "resource_already_exists") throw attachErr;
    }

    // Create a manual-capture PaymentIntent — this holds (pre-authorizes) the deposit on the card without charging it
    const depositIntent = await stripe.paymentIntents.create({
      amount: Math.round(depositAmount * 100),
      currency: "cad",
      customer: customerId,
      payment_method: paymentMethodId,
      capture_method: "manual",
      confirm: true,
      off_session: true,
      description: `Caution de sécurité - réservation ${bookingId}`,
      metadata: { bookingId },
    });

    // Persist the deposit intent and customer ID on the booking
    await BookingModel.findByIdAndUpdate(bookingId, {
      depositIntentId: depositIntent.id,
      depositStatus: "held",
      stripeSessionId: sessionId,
      stripeCustomerId: customerId,
    });

    return res.json({ msg: "Deposit hold created", depositIntentId: depositIntent.id, depositStatus: "held" });
  } catch (err) {
    console.error("Deposit hold error:", err);
    res.status(500).json({ msg: "Failed to create deposit hold", error: err.message });
  }
});

// Release the deposit hold (cancel the manual-capture PaymentIntent) — call when rental ends without issues
router.post("/release-deposit/:bookingId", async (req, res) => {
  try {
    const { bookingId } = req.params;
    const { userId } = req.body; // Caller must supply their userId for owner verification

    const booking = await BookingModel.findById(bookingId);
    if (!booking) return res.status(404).json({ msg: "Booking not found" });

    // Security: only the trailer owner may release the deposit
    if (!userId || booking.owner_id.toString() !== userId.toString()) {
      return res.status(403).json({ msg: "Not authorized to release deposit for this booking" });
    }
    if (!booking.depositIntentId) return res.status(400).json({ msg: "No deposit hold found for this booking" });
    if (booking.depositStatus !== "held") {
      return res.status(400).json({ msg: `Deposit is already ${booking.depositStatus}` });
    }

    await stripe.paymentIntents.cancel(booking.depositIntentId);
    await BookingModel.findByIdAndUpdate(bookingId, { depositStatus: "released" });

    return res.json({ msg: "Deposit released successfully", depositStatus: "released" });
  } catch (err) {
    console.error("Release deposit error:", err);
    res.status(500).json({ msg: "Failed to release deposit", error: err.message });
  }
});

// Capture the deposit hold (charge the card) — call when damage is reported
router.post("/capture-deposit/:bookingId", async (req, res) => {
  try {
    const { bookingId } = req.params;
    const { amountToCapture, userId } = req.body; // Caller must supply their userId for owner verification

    const booking = await BookingModel.findById(bookingId).populate("trailerId");
    if (!booking) return res.status(404).json({ msg: "Booking not found" });

    // Security: only the trailer owner may capture the deposit
    if (!userId || booking.owner_id.toString() !== userId.toString()) {
      return res.status(403).json({ msg: "Not authorized to charge deposit for this booking" });
    }
    if (!booking.depositIntentId) return res.status(400).json({ msg: "No deposit hold found for this booking" });
    if (booking.depositStatus !== "held") {
      return res.status(400).json({ msg: `Deposit is already ${booking.depositStatus}` });
    }

    const captureOptions = {};
    if (amountToCapture) {
      captureOptions.amount_to_capture = Math.round(parseFloat(amountToCapture) * 100);
    }

    await stripe.paymentIntents.capture(booking.depositIntentId, captureOptions);
    await BookingModel.findByIdAndUpdate(bookingId, { depositStatus: "captured" });

    return res.json({ msg: "Deposit captured successfully", depositStatus: "captured" });
  } catch (err) {
    console.error("Capture deposit error:", err);
    res.status(500).json({ msg: "Failed to capture deposit", error: err.message });
  }
});

module.exports = router;
