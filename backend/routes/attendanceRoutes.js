const express = require("express");

const {
  checkIn,
  checkOut,
  getMyAttendance,
} = require("../controllers/attendanceController");

const { protect } = require("../middleware/authMiddleware");
const authorize = require("../middleware/authorizeMiddleware");

const router = express.Router();

// Employee Check-In
router.post(
  "/check-in",
  protect,
  authorize("employee"),
  checkIn
);

// Employee Check-Out
router.post(
  "/check-out",
  protect,
  authorize("employee"),
  checkOut
);


router.get(
  "/my",
  protect,
  authorize("employee"),
  getMyAttendance
);

module.exports = router;