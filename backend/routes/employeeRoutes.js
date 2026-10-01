const express = require("express");

const {
  createEmployee,
  getEmployees,
  updateEmployee,
  toggleEmployeeStatus,
  registerEmployeeFace,
} = require("../controllers/employeeController");

const { protect } = require("../middleware/authMiddleware");
const authorize = require("../middleware/authorizeMiddleware");

const router = express.Router();

// ==========================================
// CREATE EMPLOYEE
// ==========================================
router.post("/", protect, authorize("admin"), createEmployee);

// ==========================================
// GET ALL EMPLOYEES
// ==========================================
router.get("/", protect, authorize("admin"), getEmployees);

// ==========================================
// REGISTER EMPLOYEE FACE
// ==========================================
router.post(
  "/:employeeId/face",
  protect,
  authorize("admin"),
  registerEmployeeFace,
);


// ==========================================
// UPDATE EMPLOYEE
// ==========================================

router.put(
  "/:employeeId",
  protect,
  authorize("admin"),
  updateEmployee
);

// ==========================================
// TOGGLE EMPLOYEE ACTIVE / INACTIVE
// ==========================================

router.patch(
  "/:employeeId/status",
  protect,
  authorize("admin"),
  toggleEmployeeStatus
);

module.exports = router;
