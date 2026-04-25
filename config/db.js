// Purpose: Manages the connection to the MongoDB database for all modules.

const mongoose = require('mongoose');
require('dotenv').config();

const connectDB = async () => {
    try {
        // We use the MONGO_URI from the .env file
        await mongoose.connect(process.env.MONGO_URI);
        console.log("✅ Shared MongoDB Connected Successfully!");
    } catch (err) {
        console.error("❌ Database Connection Failed:", err.message);
        process.exit(1); // Stop the server if DB fails
    }
};

module.exports = connectDB;