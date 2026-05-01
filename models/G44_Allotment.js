// Purpose: Defines the database schema (data structure) for this module.

const mongoose = require('mongoose');
const G44_AllotmentSchema = new mongoose.Schema({
    studentId: String,
    roomNumber: String
});
module.exports = mongoose.model('G44_Allotment', G44_AllotmentSchema);