// Purpose: Defines the database schema (data structure) for this module.

const mongoose = require('mongoose');
const G43_RoomSchema = new mongoose.Schema({
    roomNumber: String,
    baseRent: Number
});
module.exports = mongoose.model('G43_Room', G43_RoomSchema);