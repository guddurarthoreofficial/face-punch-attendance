const express = require("express");

const {
  createSchool,
  getSchool,
  updateSchool,
} = require("../controllers/schoolController");

const { protect } = require("../middleware/authMiddleware");
const authorize = require("../middleware/authorizeMiddleware");

const router = express.Router();

// ==========================================
// CREATE SCHOOL
// ==========================================

router.post(
  "/",
  protect,
  authorize("admin"),
  createSchool
);

// ==========================================
// GET ACTIVE SCHOOL
// ==========================================

router.get(
  "/",
  protect,
  getSchool
);

// ==========================================
// UPDATE SCHOOL
// ==========================================

router.put(
  "/",
  protect,
  authorize("admin"),
  updateSchool
);

module.exports = router;  