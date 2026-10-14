const express = require("express");

const {
  createEmployee,
  getEmployees,
  getMyProfile,
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
// GET LOGGED-IN EMPLOYEE'S OWN PROFILE
// IMPORTANT: Keep this before /:employeeId
// ==========================================
router.get("/me", protect, getMyProfile);

// ==========================================
// CREATE EMPLOYEE (ADMIN ONLY)
// ==========================================
router.post("/", protect, authorize("admin"), createEmployee);

// ==========================================
// GET ALL EMPLOYEES (ADMIN ONLY)
// ==========================================
router.get("/", protect, authorize("admin"), getEmployees);

// ==========================================
// REGISTER EMPLOYEE FACE (ADMIN ONLY)
// ==========================================
router.post(
  "/:employeeId/face",
  protect,
  authorize("admin"),
  registerEmployeeFace,
);

// ==========================================
// GET EMPLOYEE DETAILS (ADMIN ONLY)
// Keep after /me
// ==========================================
router.get("/:employeeId", protect, authorize("admin"), getEmployeeDetails);

// ==========================================
// UPDATE EMPLOYEE (ADMIN ONLY)
// ==========================================
router.put("/:employeeId", protect, authorize("admin"), updateEmployee);

// ==========================================
// TOGGLE EMPLOYEE ACTIVE / INACTIVE (ADMIN ONLY)
// ==========================================
router.patch(
  "/:employeeId/status",
  protect,
  authorize("admin"),
  toggleEmployeeStatus,
);

// ==========================================
// RESET EMPLOYEE PASSWORD (ADMIN ONLY)
// ==========================================
router.patch(
  "/:employeeId/password",
  protect,
  authorize("admin"),
  resetEmployeePassword,
);

module.exports = router;
