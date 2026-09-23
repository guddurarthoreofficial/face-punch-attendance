const express = require("express");

const {
  checkLocation,
} = require("../controllers/locationController");

const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

// Check employee location
router.post(
  "/check",
  protect,
  checkLocation
);

module.exports = router;