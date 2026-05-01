// Purpose: Defines the data structure (Schema) for this module's database entries.
// Purpose: Defines the database schema (data structure) for this module.
const mongoose = require('mongoose');

const G42_StudentSchema = new mongoose.Schema({
    studentId: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    email: { type: String }
});

module.exports = mongoose.model('G42_Student', G42_StudentSchema);