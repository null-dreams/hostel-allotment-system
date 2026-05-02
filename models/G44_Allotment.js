// Purpose: Defines the database schema (data structure) for this module.
const mongoose = require('mongoose');

const allotmentSchema = new mongoose.Schema({
    // The Universal Key linking to Group 42's student data
    studentId: {
        type: String,
        required: true,
        unique: true // Ensures a student is only allotted one room at a time
    },
    // Links to Group 43's room data
    roomNumber: {
        type: String,
        required: true
    },
    // For your group's specific year-based allotment logic
    academicYear: {
        type: String, 
        required: true,
        enum: ['1st Year', '2nd Year', '3rd Year', '4th Year']
    },
    status: {
        type: String,
        enum: ['Allotted', 'Pending Transfer', 'Vacated'],
        default: 'Allotted'
    },
    allotmentDate: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('G44_Allotment', allotmentSchema);