// Purpose: Manages the connection to the MongoDB database for all modules.

const mongoose = require('mongoose');


const connectDB = async () => {
     if (!process.env.MONGO_URL) {
        console.error("❌ ERROR: MONGO_URL is not defined in .env file.");
        process.exit(1);
    }
    try {
        // We use the MONGO_URI from the .env file
        await mongoose.connect(process.env.MONGO_URL);
        console.log("✅ Shared MongoDB Connected Successfully!");
    } catch (err) {
        console.error("❌ Database Connection Failed:", err.message);
        process.exit(1); // Stop the server if DB fails
    }
};

module.exports = connectDB;