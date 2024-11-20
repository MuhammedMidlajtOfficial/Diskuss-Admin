const mongoose = require("mongoose");
require("dotenv").config();

const connectDB = mongoose
  .connect(process.env.MongoDBURL)
  .then(() => console.log("Database connected"))
  .catch((err) => {
    console.error("MongoDB connection error:", err);
    process.exit(1);
  });

module.exports = connectDB;