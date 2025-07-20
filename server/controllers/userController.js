import Stripe from "stripe";
import User from "../models/User.model.js";
import { Purchase } from "../models/Purchase.model.js";
import Course from "../models/Course.js";

export const getUserData = async (req, res) => {
  try {
    const userId = req.auth.userId;
    let user = await User.findById(userId);

    // If user doesn't exist in MongoDB, create them from Clerk data
    if (!user) {
      console.log("User not found in DB, creating from Clerk data:", userId);
      
      // Get user data from Clerk via the auth context
      const clerkUser = req.auth; // This contains Clerk user data
      
      try {
        const userData = {
          _id: userId,
          email: clerkUser.sessionClaims?.email || "unknown@example.com",
          name: clerkUser.sessionClaims?.name || "Unknown User",
          imageUrl: clerkUser.sessionClaims?.picture || "https://via.placeholder.com/150",
        };
        
        user = await User.create(userData);
        console.log("User created successfully in DB:", user._id);
      } catch (createError) {
        console.error("Error creating user in DB:", createError);
        // If creation fails, return the error but don't break the app
        return res.json({ 
          message: "User found in Clerk but not in database. Please contact support.", 
          success: false,
          clerkUserId: userId
        });
      }
    }

    return res.json({ success: true, user });
  } catch (error) {
    return res.json({ message: error.message, success: false });
  }
};

//  User enrolled Courses with lecture links

export const userEnrolledCourses = async (req, res) => {
  try {
    const userId = req.auth.userId;
    const userData = await User.findById(userId).populate("enrolledCourses");

    return res.json({ success: true, enrolledCourses: userData.enrolledCourses });
  } catch (error) {
    return res.json({ success: false, message: error.message });
  }
};

// Manual user sync for when webhooks fail
export const syncUserFromClerk = async (req, res) => {
  try {
    const userId = req.auth.userId;
    const existingUser = await User.findById(userId);
    
    if (existingUser) {
      return res.json({ success: true, message: "User already exists", user: existingUser });
    }
    
    // Create user with basic data (you can enhance this with actual Clerk API calls)
    const userData = {
      _id: userId,
      email: req.body.email || "unknown@example.com",
      name: req.body.name || "Unknown User", 
      imageUrl: req.body.imageUrl || "https://via.placeholder.com/150",
    };
    
    const newUser = await User.create(userData);
    console.log("User manually synced:", newUser._id);
    
    return res.json({ success: true, user: newUser, message: "User created successfully" });
  } catch (error) {
    return res.json({ message: error.message, success: false });
  }
};

// Purchase Course
export const purchaseCourse = async (req, res) => {
  try {
    const { courseId } = req.body;
    const { origin } = req.headers;
    const userId = req.auth.userId;
    const userData = await User.findById(userId);
    const courseData = await Course.findById(courseId);

    if (!userData || !courseData) {
      return res.json({ message: "Data Not Found", success: false });
    }

    const purchaseData = {
      courseId: courseData._id,
      userId,
      amount: (
        courseData.coursePrice -
        (courseData.discount * courseData.coursePrice) / 100
      ).toFixed(2),
    };
    const newPurchase = await Purchase.create(purchaseData);

    // Initiallize Gateway Initiallization

    const stripeInstance = new Stripe(process.env.STRIPE_SECRET_KEY);
    const currency = process.env.CURRENCY.toLowerCase();
    // creating line items to for stripe
    const line_items = [
      {
        price_data: {
          currency,
          product_data: {
            name: courseData.courseTitle,
          },
          unit_amount: Math.floor(newPurchase.amount) * 100,
        },
        quantity: 1,
      },
    ];

    const session = await stripeInstance.checkout.sessions.create({
      success_url: `${origin}/loading/my-enrollments`,
      cancel_url: `${origin}/`,
      line_items: line_items,
      mode: "payment",
      metadata: {
        purchaseId: newPurchase._id.toString(),
      },
    });

    return res.json({ success: true, session_url: session.url });
  } catch (error) {
    return res.json({ message: error.message, success: false });
  }
};
