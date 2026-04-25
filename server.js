// Purpose: Main application entry point. Links all modules together and starts the server.

const express = require('express');
const path = require('path');
const dotenv = require('dotenv');
const connectDB = require('./config/db');

dotenv.config();
const app = express();
connectDB(); // connect to cloud DB

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public')); // This tells the server where the HTML files are


// --- API ROUTES
// app.use('/api/g42', require('./routes/G42_studentRoutes'));
// app.use('/api/g43', require('./routes/G43_roomRoutes'));
// app.use('/api/g44', require('./routes/G44_allotmentRoutes'));
// app.use('/api/g45', require('./routes/G45_paymentRoutes')); 
// app.use('/api/g46', require('./routes/G46_complaintRoutes'));

// Default route
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Server running at http://localhost:${PORT}`));