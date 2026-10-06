const User = require("../models/User");
const mongoose = require("mongoose");
const Attendance = require("../models/Attendance");

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
    const { faceData, faceSamples } = req.body;

    // ==========================================
    // BUILD FACE SAMPLES
    // ==========================================

    let samples = [];

    // New system:
    // faceSamples = [
    //   [128 values],
    //   [128 values],
    //   ...
    // ]
    if (Array.isArray(faceSamples) && faceSamples.length > 0) {
      samples = faceSamples;
    }

    // Old system compatibility:
    // faceData = [128 values]
    else if (Array.isArray(faceData) && faceData.length === 128) {
      samples = [faceData];
    }

    // ==========================================
    // VALIDATE SAMPLES
    // ==========================================

    if (samples.length === 0) {
      return res.status(400).json({
        success: false,
        message: "At least one valid face sample is required",
      });
    }

    const invalidSample = samples.some(
      (sample) =>
        !Array.isArray(sample) ||
        sample.length !== 128 ||
        sample.some(
          (value) => typeof value !== "number" || !Number.isFinite(value)
        )
    );

    if (invalidSample) {
      return res.status(400).json({
        success: false,
        message:
          "Every face sample must contain exactly 128 valid numeric values",
      });
    }

    // ==========================================
    // LIMIT SAMPLES
    // ==========================================

    if (samples.length > 5) {
      return res.status(400).json({
        success: false,
        message: "Maximum 5 face samples are allowed",
      });
    }

    // ==========================================
    // FIND EMPLOYEE
    // ==========================================

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

    // ==========================================
    // SAVE FACE DATA
    // ==========================================

    // Keep first sample in old faceData field
    // so existing attendance system continues working.
    employee.faceData = samples[0];

    // Save all samples in new field
    employee.faceSamples = samples;

    await employee.save();

    // ==========================================
    // RESPONSE
    // ==========================================

    return res.status(200).json({
      success: true,
      message: "Employee face registered successfully",
      employee: {
        id: employee._id,
        name: employee.name,
        email: employee.email,
        faceRegistered: true,
        faceSampleCount: samples.length,
      },
    });
  } catch (error) {
    console.error("Register Employee Face Error:", error);

    return res.status(500).json({
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
          Array.isArray(employee.faceData) && employee.faceData.length === 128,
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
          Array.isArray(employee.faceData) && employee.faceData.length === 128,
      },
    });
  } catch (error) {
    console.error("Toggle Employee Status Error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// ==========================================
// RESET EMPLOYEE PASSWORD
// ==========================================
const resetEmployeePassword = async (req, res) => {
  try {
    const { employeeId } = req.params;
    const { newPassword } = req.body;

    // Validate employee ID
    if (!mongoose.Types.ObjectId.isValid(employeeId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid employee ID",
      });
    }

    // Validate password
    if (!newPassword || typeof newPassword !== "string") {
      return res.status(400).json({
        success: false,
        message: "New password is required",
      });
    }

    const cleanPassword = newPassword.trim();

    if (cleanPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 6 characters",
      });
    }

    // Find employee only
    const employee = await User.findOne({
      _id: employeeId,
      role: "employee",
    }).select("+password");

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: "Employee not found",
      });
    }

    // Update password
    employee.password = cleanPassword;

    // User model pre-save middleware will hash the password
    await employee.save();

    return res.status(200).json({
      success: true,
      message: "Employee password reset successfully",
      employee: {
        id: employee._id,
        name: employee.name,
        email: employee.email,
      },
    });
  } catch (error) {
    console.error("Reset Employee Password Error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

const getEmployeeDetails = async (req, res) => {
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
    }).select(
      "name email phone role isActive faceData createdAt updatedAt"
    );

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: "Employee not found",
      });
    }

    // ==========================================
    // ALL ATTENDANCE RECORDS
    // ==========================================

    const attendanceRecords = await Attendance.find({
      employee: employeeId,
    })
      .sort({ date: -1 })
      .lean();

    // ==========================================
    // ATTENDANCE SUMMARY
    // ==========================================

    let present = 0;
    let late = 0;
    let absent = 0;

    attendanceRecords.forEach((record) => {
      if (record.status === "late") {
        late++;
      } else if (record.status === "present") {
        present++;
      } else if (record.status === "absent") {
        absent++;
      }
    });

    // ==========================================
    // RECENT ATTENDANCE
    // ==========================================

    const recentAttendance = attendanceRecords
      .slice(0, 5)
      .map((record) => ({
        id: record._id,
        date: record.date,
        status: record.status,
        checkIn: record.checkIn,
        checkOut: record.checkOut,
        faceVerified: record.faceVerified,
        checkInLocation: record.checkInLocation,
        checkOutLocation: record.checkOutLocation,
      }));

    // ==========================================
    // FACE STATUS
    // ==========================================

    const faceRegistered =
      Array.isArray(employee.faceData) &&
      employee.faceData.length === 128;

    // ==========================================
    // RESPONSE
    // ==========================================

    return res.status(200).json({
      success: true,

      employee: {
        id: employee._id,
        name: employee.name,
        email: employee.email,
        phone: employee.phone,
        role: employee.role,
        isActive: employee.isActive,
        faceRegistered,
        createdAt: employee.createdAt,
        updatedAt: employee.updatedAt,

        attendanceSummary: {
          present,
          late,
          absent,
          totalAttendanceRecords: attendanceRecords.length,
        },

        recentAttendance,
      },
    });
  } catch (error) {
    console.error("Get Employee Details Error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};


module.exports = {
  createEmployee,
  getEmployees,
  getEmployeeDetails,
  updateEmployee,
  toggleEmployeeStatus,
  registerEmployeeFace,
  resetEmployeePassword,
};
