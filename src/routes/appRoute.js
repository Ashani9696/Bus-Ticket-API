const express = require('express');
const routeController = require('../controllers/routeController');
const permitController = require('../controllers/permitController');
const busController = require('../controllers/busController');
const seatController = require('../controllers/seatsController');
const bookingController = require('../controllers/bookingController');
const userController = require('../controllers/userController');
const { authorize, protect } = require('../middlewares/authMiddleware');
const { permitValidationSchema, permitUpdateValidationSchema } = require('../validations/permitValidator');
const { busValidationSchema, busUpdateValidationSchema } = require('../validations/busValidator');
const { seatValidationSchema, seatUpdateValidationSchema } = require('../validations/seatValidator');
const { routeCreationValidationSchema, routeUpdateValidationSchema } = require('../validations/route');
const { userCreateValidationSchema, userUpdateValidationSchema } = require('../validations/userValidator');

const router = express.Router();
router.use(protect);

router.use(authorize('commuter', 'admin', 'bus_operator'));
router.post('/booking', bookingController.bookSeats);
router.delete('/booking/:bookingId/cancel', bookingController.cancelBooking);
router.get('/user-bookings', bookingController.getUserBookings);
router.get('/view-seats/:id', seatController.getAllSeatsWithDate);

router.get('/route/calculate-fare', routeController.calculateFare);
router.get('/route', routeController.getAllRoutes);

router.use(authorize('admin', 'bus_operator'));
router.post('/route', routeCreationValidationSchema, routeController.createRoute);
router.get('/route/:id', routeController.getRouteById);
router.put('/route/:id', routeUpdateValidationSchema, routeController.updateRoute);
router.delete('/route/:id', routeController.deleteRoute);
router.put('/route/:routeId/assign-busses', routeController.assignBusesToRoute);

router.post('/bus', busValidationSchema, busController.createBus);
router.get('/buses', busController.getAllBuses);
router.get('/bus/:id', busController.getBusById);
router.put('/bus/:id', busUpdateValidationSchema, busController.updateBus);
router.delete('/bus/:id', busController.deleteBus);

router.post('/bus/:id/seats', seatValidationSchema, seatController.createSeatMatrix);
router.get('/bus/:id/seats', seatController.getAllSeats);
router.get('/bus/:id/seats/:row/:column', seatController.getSeat);
router.put('/bus/:id/seats', seatUpdateValidationSchema, seatController.updateSeatMatrix);
router.put('/bus/:id/seats/:row/:column', seatController.updateSeat);
router.delete('/bus/:id/seats', seatController.deleteSeatMatrix);

router.use(authorize('admin'));
router.post('/user', userCreateValidationSchema, userController.createUser);
router.get('/users', userController.getUsers);
router.get('/users/:id', userController.getUserById);
router.put('/users/:id', userUpdateValidationSchema, userController.updateUser);
router.delete('/users/:id', userController.deleteUser);
router.post('/users/:id/reset-password', userController.resetPassword);

router.post('/permit', permitValidationSchema, permitController.createPermit);
router.get('/permit', permitController.getAllPermits);
router.get('/permit/:id', permitController.getPermitById);
router.put('/permit/:id', permitUpdateValidationSchema, permitController.updatePermit);
router.delete('/permit/:id', permitController.deletePermit);
router.get('/permit/check/:permitNumber', permitController.checkPermitValidity);

router.get('/bookings', bookingController.getAllBookings);



module.exports = router;
