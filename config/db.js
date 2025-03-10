import mongoose from "mongoose";

let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

async function connectDB() {
  // If already connected, return the connection
  if (cached.conn) {
    console.log("Using cached MongoDB connection");
    return cached.conn;
  }

  // If a connection promise exists, wait for it
  if (cached.promise) {
    console.log("Waiting for existing MongoDB connection promise");
    cached.conn = await cached.promise;
    return cached.conn;
  }

  try {
    console.log("Establishing new MongoDB connection...");
    const opts = {
      bufferCommands: false,
    };

    // Ensure MONGODB_URI is set
    if (!process.env.MONGODB_URI) {
      throw new Error("MONGODB_URI environment variable is not set");
    }

    cached.promise = mongoose.connect(`${process.env.MONGODB_URI}/atexas`, opts);
    cached.conn = await cached.promise;
    console.log("Successfully connected to MongoDB");
    return cached.conn;
  } catch (error) {
    console.error("Failed to connect to MongoDB:", error);
    cached.promise = null; // Reset promise on failure
    throw new Error(`Database connection failed: ${error.message}`);
  }
}

export default connectDB;