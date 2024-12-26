const express = require('express');
const commuterController = require('../controllers/commuterController');
const { protect, authorize } = require('../middlewares/authMiddleware');

const router = express.Router();

router.use(protect, authorize('user'));

router.get('/routes', commuterController.listRoutes);
router.get('/routes/:routeId', commuterController.getRouteDetails);
router.get('/trips/:tripId', commuterController.getTripDetails);

module.exports = router;