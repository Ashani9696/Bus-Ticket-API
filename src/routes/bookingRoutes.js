const express = require('express');
const bookingController = require('../controllers/bookingController');

const router = express.Router();

router.get('/booking-details/:bookingId', bookingController.getBookingDetails);

module.exports = router;
