// Purpose: Stores global settings for the Fee Module (like Late Fee deadlines).
const mongoose = require('mongoose');

const G45_SettingsSchema = new mongoose.Schema({
    lateFeeDueDate: { type: Date, required: true },
    lateFeeAmount: { type: Number, default: 1000 }
});

module.exports = mongoose.model('G45_Settings', G45_SettingsSchema);