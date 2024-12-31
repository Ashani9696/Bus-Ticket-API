const express = require('express');
const commuterController = require('../controllers/commuterController');
const { protect, authorize } = require('../middlewares/authMiddleware');

const router = express.Router();

router.use(protect, authorize('user'));

router.get('/routes', commuterController.listRoutes);
router.get('/routes/:routeId', commuterController.getRouteDetails);
router.get('/trips/:tripId', commuterController.getTripDetails);
router.get('/trips', commuterController.listTrips);

router.post('/bookings', commuterController.makeBooking);
router.get('/bookings/:bookingId', commuterController.getBookingDetails);
router.put('/bookings/:bookingId', commuterController.modifyBooking);
router.delete('/bookings/:bookingId', commuterController.cancelBooking);
router.get('/bookings', commuterController.listBookings);

router.post('/payments', commuterController.makePayment);

module.exports = router;
