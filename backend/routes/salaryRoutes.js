const express = require("express");
const router = express.Router();

const {
  createSalary,
  getAllSalaries,
  getMySalaries,
  updateSalary,
} = require("../controllers/salaryController");

// Existing project middleware — do not modify
const { protect } = require("../middleware/authMiddleware");
const authorize = require("../middleware/authorizeMiddleware");

// Employee: view own salary records
router.get("/my", protect, getMySalaries);

// Admin: view all salary records
router.get("/", protect, authorize("admin"), getAllSalaries);

// Admin: create salary record
router.post("/", protect, authorize("admin"), createSalary);

// Admin: update salary record
router.put("/:id", protect, authorize("admin"), updateSalary);

module.exports = router;