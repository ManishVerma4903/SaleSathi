const express = require('express');
const router = express.Router();
const {
  getAdminStats,
  getAllUsers,
  getUserStats,
  getUserDetails,
  updateUser
} = require('../controllers/adminController');
const { protect } = require('../middleware/authMiddleware');
const { isAdmin } = require('../middleware/roleMiddleware');

router.use(protect);
router.use(isAdmin);

router.get('/stats', getAdminStats);
router.get('/users', getAllUsers);
router.get('/users/:id', getUserDetails);
router.get('/users/:id/stats', getUserStats);
router.put('/users/:id', updateUser);

module.exports = router;
