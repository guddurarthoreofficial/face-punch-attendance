const express = require("express");

const {
  createSchool,
  getSchool,
} = require("../controllers/schoolController");

const { protect } = require("../middleware/authMiddleware");
const authorize = require("../middleware/authorizeMiddleware");

const router = express.Router();

// Admin creates school location
router.post(
  "/",
  protect,
  authorize("admin"),
  createSchool
);

// Logged-in users can see active school
router.get(
  "/",
  protect,
  getSchool
);

module.exports = router;