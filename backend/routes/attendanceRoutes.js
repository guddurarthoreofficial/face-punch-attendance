const express = require("express");

const {
  checkIn,
  checkOut,
  getMyAttendance,
  getAdminDashboardStats,
  getAdminTodayAttendance, 
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

// ==========================================
// ADMIN DASHBOARD STATS
// ==========================================

router.get(
  "/admin/stats",
  protect,
  authorize("admin"),
  getAdminDashboardStats
);

// ==========================================
// ADMIN TODAY'S ATTENDANCE
// ==========================================

router.get(
  "/admin/today",
  protect,
  authorize("admin"),
  getAdminTodayAttendance
);


module.exports = router;