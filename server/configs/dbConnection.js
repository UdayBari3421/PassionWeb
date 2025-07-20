import mongoose from "mongoose";

export const connectDB = async () => {
  try {
    mongoose.connection.on("connected", () => console.log("Connected With MongoDB"));
    mongoose.connection.on("error", (err) => console.log("MongoDB connection error:", err));
    mongoose.connection.on("disconnected", () => console.log("MongoDB disconnected"));

    await mongoose.connect(`${process.env.MONGODB_URI}/passiondb`);
    console.log("MongoDB URI:", process.env.MONGODB_URI ? "Set" : "Not Set");
  } catch (error) {
    console.log("ERROR WHILE CONNECTING WITH PASSION DB : ", error);
    throw error;
  }
};
