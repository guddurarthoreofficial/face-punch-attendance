const User = require("../models/User");
const mongoose = require("mongoose");


// ==========================================
// CREATE EMPLOYEE
// ==========================================
const createEmployee = async (req, res) => {
  try {
    const { name, email, phone, password } = req.body;

    if (!name || !email || !phone || !password) {
      return res.status(400).json({
        success: false,
        message: "Name, email, phone and password are required",
      });
    }

    const existingEmployee = await User.findOne({ email });

    if (existingEmployee) {
      return res.status(409).json({
        success: false,
        message: "User already exists with this email",
      });
    }

    const employee = await User.create({
      name,
      email,
      phone,
      password,
      role: "employee",
    });

    res.status(201).json({
      success: true,
      message: "Employee created successfully",
      employee: {
        id: employee._id,
        name: employee.name,
        email: employee.email,
        phone: employee.phone,
        role: employee.role,
        isActive: employee.isActive,
      },
    });
  } catch (error) {
    console.error("Create Employee Error:", error);

    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// ==========================================
// GET ALL EMPLOYEES
// ==========================================
const getEmployees = async (req, res) => {
  try {
    const employees = await User.find({
      role: "employee",
    })
      .select("name email phone role isActive createdAt updatedAt faceData")
      .lean();

    const safeEmployees = employees.map((employee) => ({
      _id: employee._id,
      name: employee.name,
      email: employee.email,
      phone: employee.phone,
      role: employee.role,
      isActive: employee.isActive,
      createdAt: employee.createdAt,
      updatedAt: employee.updatedAt,

      // Only send registration status.
      // Never send the actual face descriptor.
      faceRegistered:
        Array.isArray(employee.faceData) && employee.faceData.length === 128,
    }));

    res.status(200).json({
      success: true,
      count: safeEmployees.length,
      employees: safeEmployees,
    });
  } catch (error) {
    console.error("Get Employees Error:", error);

    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// ==========================================
// REGISTER EMPLOYEE FACE
// ==========================================
const registerEmployeeFace = async (req, res) => {
  try {
    const { employeeId } = req.params;
    const { faceData } = req.body;

    if (!Array.isArray(faceData) || faceData.length !== 128) {
      return res.status(400).json({
        success: false,
        message: "Valid 128-value face data is required",
      });
    }

    const employee = await User.findOne({
      _id: employeeId,
      role: "employee",
    });

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: "Employee not found",
      });
    }

    employee.faceData = faceData;

    await employee.save();

    res.status(200).json({
      success: true,
      message: "Employee face registered successfully",
      employee: {
        id: employee._id,
        name: employee.name,
        email: employee.email,
        faceRegistered: true,
      },
    });
  } catch (error) {
    console.error("Register Employee Face Error:", error);

    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};


// ==========================================
// UPDATE EMPLOYEE
// ==========================================
const updateEmployee = async (req, res) => {
  try {
    const { employeeId } = req.params;
    const { name, email, phone } = req.body;

    if (!mongoose.Types.ObjectId.isValid(employeeId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid employee ID",
      });
    }

    if (!name || !email || !phone) {
      return res.status(400).json({
        success: false,
        message: "Name, email and phone are required",
      });
    }

    const cleanName = name.trim();
    const cleanEmail = email.trim().toLowerCase();
    const cleanPhone = phone.trim();

    if (!cleanName) {
      return res.status(400).json({
        success: false,
        message: "Employee name is required",
      });
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      return res.status(400).json({
        success: false,
        message: "Invalid email address",
      });
    }

    if (!/^\d{10}$/.test(cleanPhone)) {
      return res.status(400).json({
        success: false,
        message: "Phone number must contain exactly 10 digits",
      });
    }

    const employee = await User.findOne({
      _id: employeeId,
      role: "employee",
    });

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: "Employee not found",
      });
    }

    const existingUser = await User.findOne({
      email: cleanEmail,
      _id: { $ne: employeeId },
    });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "Another user already exists with this email",
      });
    }

    employee.name = cleanName;
    employee.email = cleanEmail;
    employee.phone = cleanPhone;

    await employee.save();

    return res.status(200).json({
      success: true,
      message: "Employee updated successfully",
      employee: {
        id: employee._id,
        name: employee.name,
        email: employee.email,
        phone: employee.phone,
        role: employee.role,
        isActive: employee.isActive,
        faceRegistered:
          Array.isArray(employee.faceData) &&
          employee.faceData.length === 128,
      },
    });
  } catch (error) {
    console.error("Update Employee Error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// ==========================================
// TOGGLE EMPLOYEE STATUS
// ==========================================
const toggleEmployeeStatus = async (req, res) => {
  try {
    const { employeeId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(employeeId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid employee ID",
      });
    }

    const employee = await User.findOne({
      _id: employeeId,
      role: "employee",
    });

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: "Employee not found",
      });
    }

    employee.isActive = !employee.isActive;

    await employee.save();

    return res.status(200).json({
      success: true,
      message: employee.isActive
        ? "Employee activated successfully"
        : "Employee deactivated successfully",
      employee: {
        id: employee._id,
        name: employee.name,
        email: employee.email,
        phone: employee.phone,
        role: employee.role,
        isActive: employee.isActive,
        faceRegistered:
          Array.isArray(employee.faceData) &&
          employee.faceData.length === 128,
      },
    });
  } catch (error) {
    console.error(
      "Toggle Employee Status Error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

module.exports = {
  createEmployee,
  getEmployees,
  updateEmployee,
  toggleEmployeeStatus,
  registerEmployeeFace,
};