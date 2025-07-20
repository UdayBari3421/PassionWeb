import { Webhook } from "svix";
import User from "../models/User.model.js";
import Stripe from "stripe";
import { Purchase } from "../models/Purchase.model.js";
import Course from "../models/Course.js";

// API controller fnc to manage clerk user with db
export const clerkWebhooks = async (req, res) => {
  try {
    // Get the headers
    const svix_id = req.headers["svix-id"];
    const svix_timestamp = req.headers["svix-timestamp"];
    const svix_signature = req.headers["svix-signature"];

    // If there are no headers, error out
    if (!svix_id || !svix_timestamp || !svix_signature) {
      return res.status(400).json({ error: "Error occurred -- no svix headers" });
    }

    // Get the body as a string
    const body = req.body;
    const payload = body.toString();

    const wh = new Webhook(process.env.CLERK_WEBHOOK_SECRET);

    let evt;

    try {
      evt = wh.verify(payload, {
        "svix-id": svix_id,
        "svix-timestamp": svix_timestamp,
        "svix-signature": svix_signature,
      });
    } catch (err) {
      console.log("Webhook signature verification failed.", err.message);
      return res.status(400).json({ error: "Webhook signature verification failed" });
    }

    // Do something with the payload
    const { data, type } = evt;
    console.log("Webhook received:", type);

    switch (type) {
      case "user.created": {
        console.log("Creating user:", data.id);
        const userData = {
          _id: data.id,
          email: data.email_addresses[0].email_address,
          name: data.first_name + " " + data.last_name,
          imageUrl: data.image_url,
        };
        const newUser = await User.create(userData);
        console.log("User created successfully:", newUser._id);
        res.json({ success: true });
        break;
      }
      case "user.updated": {
        console.log("Updating user:", data.id);
        const userData = {
          email: data.email_addresses[0].email_address,
          name: data.first_name + " " + data.last_name,
          imageUrl: data.image_url,
        };

        const updatedUser = await User.findByIdAndUpdate(data.id, userData);
        console.log("User updated successfully:", data.id);
        res.json({ success: true });
        break;
      }
      case "user.deleted": {
        console.log("Deleting user:", data.id);
        await User.findByIdAndDelete(data.id);
        console.log("User deleted successfully:", data.id);
        res.json({ success: true });
        break;
      }
      default:
        console.log("Unhandled webhook type:", type);
        res.json({ success: true });
        break;
    }
  } catch (error) {
    console.error("Webhook error:", error.message);
    res.status(400).json({ success: false, message: error.message });
  }
};

const stripeInstance = new Stripe(process.env.STRIPE_SECRET_KEY);

export const stripeWebHooks = async (request, response) => {
  const sig = request.headers["stripe-signature"];

  let event;

  try {
    event = Stripe.webhooks.constructEvent(request.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    response.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle the event
  switch (event.type) {
    case "payment_intent.succeeded": {
      const paymentIntent = event.data.object;
      const paymentIntentId = paymentIntent.id;

      const session = await stripeInstance.checkout.sessions.list({
        payment_intent: paymentIntentId,
      });

      const { purchaseId } = session.data[0].metadata;

      const purchaseData = await Purchase.findById(purchaseId);
      const userData = await User.findById(purchaseData.userId);
      const courseData = await Course.findById(purchaseData.courseId.toString());

      courseData.enrolledStudents.push(userData);
      await courseData.save();

      userData.enrolledCourses.push(courseData._id);
      await userData.save();

      purchaseData.status = "completed";
      await purchaseData.save();

      break;
    }
    case "payment_intent.payment_failed": {
      const paymentIntent = event.data.object;
      const paymentIntentId = paymentIntent.id;

      const session = await stripeInstance.checkout.sessions.list({
        payment_intent: paymentIntentId,
      });

      const { purchaseId } = session.data[0].metadata;
      const purchaseData = await Purchase.findById(purchaseId);
      purchaseData.status = "failed";

      await purchaseData.save();
      break;
    }
    default:
      console.log(`Unhandled event type ${event.type}`);
      break;
  }

  response.json({ received: true });
};
