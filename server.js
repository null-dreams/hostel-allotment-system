// Purpose: Main application entry point. Links all modules together and starts the server.

const express = require('express');
const path = require('path');
const dotenv = require('dotenv');
const connectDB = require('./config/db');

dotenv.config();
const app = express();

console.log(process.env.MONGO_URL);

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public')); // This tells the server where the HTML files are


// --- API ROUTES
// app.use('/api/g42', require('./routes/G42_studentRoutes'));
// app.use('/api/g43', require('./routes/G43_roomRoutes'));
app.use('/api/g44', require('./routes/G44_allotmentRoutes'));
app.use('/api/g45', require('./routes/G45_paymentRoutes')); 
// app.use('/api/g46', require('./routes/G46_complaintRoutes'));

// Default route
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const startProject = async () => {
    try {
        // First, wait for the database to be 100% ready
        await connectDB(); // Connect to cloud

        // ONLY after DB is connected, we start the server
        const PORT = process.env.PORT || 3000;
        app.listen(PORT, '0.0.0.0', () => {
            console.log(`🚀 Server running at http://localhost:${PORT}`);
        });
    } catch (err) {
        console.error("❌ CRITICAL: Server failed to start due to DB issues.");
        process.exit(1);
    }
};

startProject();

// ==========================================
// HUTDOWN
// ==========================================
process.on('SIGINT', async () => {
    console.log("🛑 Shutting down server...");
    const mongoose = require('mongoose');
    if(mongoose) {
        await mongoose.connection.close();
        console.log("✅ MongoDB Connection closed.");
    }
    process.exit(0);
});