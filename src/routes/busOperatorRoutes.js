const express = require('express');
const busOperatorController = require('../controllers/busOperatorController');
const adminController = require('../controllers/adminController');
const { protect, authorize } = require('../middlewares/authMiddleware');

const router = express.Router();

router.use(protect, authorize('bus_operator'));

router.get('/buses', busOperatorController.getMyBuses);
router.post('/buses', adminController.createBus);
router.put('/buses/:busId', busOperatorController.updateBus);
router.delete('/buses/:busId', busOperatorController.deleteBus);
router.get('/routes', adminController.viewAllRoutes);

router.post('/trip', busOperatorController.createTrip);
router.put('/trips/:tripId', busOperatorController.updateTrip);
router.delete('/trips/:tripId', busOperatorController.deleteTrip);
router.get('/trips', busOperatorController.getAllTrips);
router.get('/trips/:tripId', busOperatorController.getTripDetails);

router.get('/bookings', busOperatorController.getBookings);
router.put('/bookings/:bookingId/cancel', busOperatorController.cancelBooking);

router.get('/payments', busOperatorController.getPayments);

module.exports = router;


