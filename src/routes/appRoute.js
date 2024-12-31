const express = require('express');
const routeController = require('../controllers/routeController');
const permitController = require('../controllers/permitController');
const busController = require('../controllers/busController');
const seatController = require('../controllers/seatsController');
const bookingController = require('../controllers/bookingController');
const userController = require('../controllers/userController');
const { authorize, protect } = require('../middlewares/authMiddleware');

const router = express.Router();
router.use(protect);

router.use(authorize('admin'));
router.post('/user', userController.createUser);
router.get('/users', userController.getUsers);
router.get('/users/:id', userController.getUserById);
router.put('/users/:id', userController.updateUser);
router.delete('/users/:id', userController.deleteUser);
router.post('/users/:id/reset-password', userController.resetPassword);

router.post('/permit', permitController.createPermit);
router.get('/permit', permitController.getAllPermits);
router.get('/permit/:id', permitController.getPermitById);
router.put('/permit/:id', permitController.updatePermit);
router.delete('/permit/:id', permitController.deletePermit);
router.get('/permit/:permitNumber', permitController.checkPermitValidity);

router.use(authorize('admin', 'bus_operator'));
router.get('/route/calculate-fare', routeController.calculateFare);
router.post('/route', routeController.createRoute);
router.get('/route', routeController.getAllRoutes);
router.get('/route/:id', routeController.getRouteById);
router.put('/route/:id', routeController.updateRoute);
router.delete('/route/:id', routeController.deleteRoute);
router.put('/route/:routeId/assign-busses', routeController.assignBusesToRoute);

router.post('/bus', busController.createBus);
router.get('/buses', busController.getAllBuses);
router.get('/bus/:id', busController.getBusById);
router.put('/bus/:id', busController.updateBus);
router.delete('/bus/:id', busController.deleteBus);

router.post('/bus/:id/seats', seatController.createSeatMatrix);
router.get('/bus/:id/seats', seatController.getAllSeats);
router.get('/bus/:id/seats/:row/:column', seatController.getSeat);
router.put('/bus/:id/seats', seatController.updateSeatMatrix);
router.put('/bus/:id/seats/:row/:column', seatController.updateSeat);
router.delete('/bus/:id/seats', seatController.deleteSeatMatrix);

router.use(authorize('commuter'));
router.post('/booking', bookingController.bookSeats);
router.delete('/booking/:bookingId/cancel', bookingController.cancelBooking);
router.get('/bookings', bookingController.getAllBookings);

module.exports = router;
