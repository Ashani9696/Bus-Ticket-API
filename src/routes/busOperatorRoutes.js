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

module.exports = router;