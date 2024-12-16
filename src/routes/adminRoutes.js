const express = require('express');
const adminController = require('../controllers/adminController');
const { authorize, protect } = require('../middlewares/authMiddleware');

const router = express.Router();
router.use(protect, authorize('admin'));


router.post('/users', adminController.createUser);
router.put('/users/:userId', adminController.updateUser);
router.delete('/users/:userId', adminController.deleteUser);
router.get('/users/:userId', adminController.viewUserById);
router.get('/users', adminController.viewAllUsers)

module.exports = router;