// Purpose: Defines the database schema (data structure) for this module.
// Ensure this is the last line of models/G45_Payment.js

const mongoose = require('mongoose');


const G45_PaymentSchema = new mongoose.Schema({
    
    // 1.Identification
    studentId: {
        type: String,
        required: true,
        unique: true,
        ref: 'G42_Student'
    },

    // 2. Money tracking
    totalAmount: { type: Number, default: 0 },
    paidAmount: { type: Number, default: 0 },
    balance: { type: Number, default: 0 },
    lateFeeApplied: { type: Boolean, default: false},
    lateFeeAmountApplied: { type: Number, default: 0 }, 


    // 3. Status for Tracking Dues
    status: { 
        type: String, 
        enum: ['Pending', 'Partial', 'Paid'], 
        default: 'Pending' 
    },

    // 4. History
    history: [{
        amountPaid: Number,
        date: { type: Date, default: Date.now },
        transactionId: String,
        paymentMethod: String
    }]
}, {timestamps: true});

module.exports = mongoose.model('G45_Payment', G45_PaymentSchema);