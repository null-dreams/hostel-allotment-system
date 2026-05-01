// Purpose: The "Traffic Controller"—it maps web addresses (URLs) to the correct function in the controller.


const express = require('express');
const router = express.Router();
const G45_paymentCtrl = require('../controllers/G45_paymentCtrl');

// Route for loading analytics
router.get('/analytics', G45_paymentCtrl.getAnalytics);

// Route for finding a student's record
// URL: /api/g45/record/:id
router.get('/record/:id', G45_paymentCtrl.getRecord);

// Route for processing a payment
router.post('/pay', G45_paymentCtrl.processPayment);

// Route for generating Reciepts
// URL: /api/g45/receipt/:studentId/:txnId
router.get('/receipt/:studentId/:txnId', G45_paymentCtrl.generatePDFReceipt);

// QR Verification Page (HTML)
router.get('/verify/:studentId/:txnId', G45_paymentCtrl.verifyReceipt);

router.get('/settings', G45_paymentCtrl.getSettings);
router.post('/settings', G45_paymentCtrl.updateSettings);

module.exports = router;