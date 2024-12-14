const express = require("express");
const { getProfile } = require("../controllers/userController");
const { protect, authorize } = require("../middlewares/authMiddleware");

const router = express.Router();


router.get("/profile", protect, getProfile);
router.get("/admin", protect, authorize("admin"), (req, res) => {
  res.json({ message: "Welcome Admin!" });
});
router.get("/sfadmin", protect, authorize("sfadmin"), (req, res) => {
  res.json({ message: "Welcome SF Admin!" });
});

module.exports = router;
