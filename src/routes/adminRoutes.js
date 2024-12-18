const express = require('express');
const adminController = require('../controllers/adminController');
const { authorize, protect } = require('../middlewares/authMiddleware');

const router = express.Router();
router.use(protect, authorize('admin'));

router.post('/routes', adminController.createRoute);
router.put('/routes/:routeId', adminController.updateRoute);
router.delete('/routes/:routeId', adminController.deleteRoute);
router.get('/routes/:routeId', adminController.viewRouteById);
router.get('/routes', adminController.viewAllRoutes);


router.post('/users', adminController.createUser);
router.put('/users/:userId', adminController.updateUser);
router.delete('/users/:userId', adminController.deleteUser);
router.get('/users/:userId', adminController.viewUserById);
router.get('/users', adminController.viewAllUsers)

router.post('/buses', adminController.createBus);
router.put('/buses/:busId', adminController.updateBus);
router.delete('/buses/:busId', adminController.deleteBus);
router.get('/buses/:busId', adminController.viewBusById);
router.get('/buses', adminController.viewAllBuses);

module.exports = router;