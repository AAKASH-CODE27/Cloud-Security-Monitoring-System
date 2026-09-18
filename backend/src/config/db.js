const mongoose = require("mongoose");

// ============================================================
// MongoDB Connection
// Equivalent to Spring's spring.datasource.* properties
// ============================================================

const connectDB = async () => {
  try {
    const uri =
      process.env.MONGO_URI ||
      "mongodb://localhost:27017/secureopsprojectes";

    mongoose.set("strictQuery", true);

    await mongoose.connect(uri);

    console.log("============================================");
    console.log("MongoDB Connected");
    console.log("URI:", uri);
    console.log("============================================");
  } catch (error) {
    console.error("MongoDB connection failed:", error.message);
    process.exit(1);
  }
};

module.exports = connectDB;
