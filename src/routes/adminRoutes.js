const express = require('express');
const adminController = require('../controllers/adminController');
const routeController = require('../controllers/routeController');
const permitController = require('../controllers/permitController');
const busController = require('../controllers/busController');
const seatController = require('../controllers/seatsController');
const { authorize, protect } = require('../middlewares/authMiddleware');
const permitValidationMiddleware = require('../validations/permit/createSchema');

const router = express.Router();
router.use(protect, authorize('admin'));

router.get('/route/calculate-fare', routeController.calculateFare);
router.post('/route', routeController.createRoute);
router.get('/route', routeController.getAllRoutes);
router.get('/route/:id', routeController.getRouteById);
router.put('/route/:id', routeController.updateRoute);
router.delete('/route/:id', routeController.deleteRoute);

router.post('/permit', permitValidationMiddleware, permitController.createPermit);
router.get('/permit', permitController.getAllPermits);
router.get('/permit/:id', permitController.getPermitById);
router.put('/permit/:id', permitController.updatePermit);
router.delete('/permit/:id', permitController.deletePermit);
router.get('/permit/status', permitController.getPermitStats);
router.get('/permit/:permitNumber', permitController.checkPermitValidity);

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

router.post('/users', adminController.createUser);
router.put('/users/:userId', adminController.updateUser);
router.delete('/users/:userId', adminController.deleteUser);
router.get('/users/:userId', adminController.viewUserById);
router.get('/users', adminController.viewAllUsers);

router.get('/payments', adminController.viewAllPayments);

router.get('/operators', adminController.viewAllBusOperators);
router.put('/operators/:userId', adminController.updateBusOperator);

module.exports = router;
