const express = require("express");

const {
  createEmployee,
  getEmployees,
  updateEmployee,
  toggleEmployeeStatus,
  registerEmployeeFace,
  resetEmployeePassword,
  getEmployeeDetails,
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

router.get("/:employeeId", protect, authorize("admin"), getEmployeeDetails);

// ==========================================
// UPDATE EMPLOYEE
// ==========================================
router.put("/:employeeId", protect, authorize("admin"), updateEmployee);

// ==========================================
// TOGGLE EMPLOYEE ACTIVE / INACTIVE
// ==========================================
router.patch(
  "/:employeeId/status",
  protect,
  authorize("admin"),
  toggleEmployeeStatus,
);

// ==========================================
// RESET EMPLOYEE PASSWORD
// ==========================================
router.patch(
  "/:employeeId/password",
  protect,
  authorize("admin"),
  resetEmployeePassword,
);

module.exports = router;
