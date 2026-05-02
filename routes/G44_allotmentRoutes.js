// Purpose: The "Traffic Controller"—it maps web addresses (URLs) to the correct function in the controller.

const express = require('express');
const router = express.Router();

// Import the "Brain" you just created
const allotmentController = require('../controllers/G44_allotmentCtrl');

// The Traffic Cop: Pointing URLs to the right controller functions
router.get('/allotments', allotmentController.getAllotments);
router.post('/assign', allotmentController.assignRoom);

module.exports = router;