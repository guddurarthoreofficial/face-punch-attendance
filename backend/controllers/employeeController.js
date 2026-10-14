const User = require("../models/User");
const mongoose = require("mongoose");
const Attendance = require("../models/Attendance");

// Fields safe to return in employee lists and ordinary responses.
const getSafeEmployee = (employee) => ({
  _id: employee._id,
  id: employee._id,
  name: employee.name,
  email: employee.email,
  phone: employee.phone,
  role: employee.role,
  isActive: employee.isActive,
  dateOfBirth: employee.dateOfBirth || null,
  currentAddress: employee.currentAddress || "",
  permanentAddress: employee.permanentAddress || "",
  qualification: employee.qualification || "",
  specialization: employee.specialization || "",
  designation: employee.designation || "",
  isClassTeacher: employee.isClassTeacher || false,
  classTeacherClass: employee.classTeacherClass || "",
  classTeacherSection: employee.classTeacherSection || "",
  subjects: employee.subjects || [],
  createdAt: employee.createdAt,
  updatedAt: employee.updatedAt,
  faceRegistered:
    Array.isArray(employee.faceData) && employee.faceData.length === 128,
});

const getBankDetails = (employee) => ({
  accountHolderName: employee.bankDetails?.accountHolderName || "",
  bankName: employee.bankDetails?.bankName || "",
  accountNumber: employee.bankDetails?.accountNumber || "",
  ifscCode: employee.bankDetails?.ifscCode || "",
  upiId: employee.bankDetails?.upiId || "",
});

const cleanText = (value) => (typeof value === "string" ? value.trim() : "");

const readEmployeeFields = (body, employee) => {
  const textFields = [
    "currentAddress",
    "permanentAddress",
    "qualification",
    "specialization",
    "designation",
    "classTeacherClass",
    "classTeacherSection",
  ];

  textFields.forEach((field) => {
    if (body[field] !== undefined) {
      employee[field] = cleanText(body[field]);
    }
  });

  if (body.dateOfBirth !== undefined) {
    employee.dateOfBirth = body.dateOfBirth || null;
  }

  if (body.isClassTeacher !== undefined) {
    employee.isClassTeacher = body.isClassTeacher === true;
  }

  if (body.subjects !== undefined) {
    if (
      !Array.isArray(body.subjects) ||
      !body.subjects.every((subject) => typeof subject === "string")
    ) {
      throw new Error("Subjects must be an array of strings");
    }

    employee.subjects = body.subjects
      .map((subject) => subject.trim())
      .filter(Boolean);
  }

  if (body.bankDetails !== undefined) {
    if (
      !body.bankDetails ||
      typeof body.bankDetails !== "object" ||
      Array.isArray(body.bankDetails)
    ) {
      throw new Error("Invalid bank details");
    }

    const allowedBankFields = [
      "accountHolderName",
      "bankName",
      "accountNumber",
      "ifscCode",
      "upiId",
    ];

    if (!employee.bankDetails) {
      employee.bankDetails = {};
    }

    allowedBankFields.forEach((field) => {
      if (body.bankDetails[field] !== undefined) {
        employee.bankDetails[field] = cleanText(body.bankDetails[field]);
      }
    });

    if (employee.bankDetails.ifscCode) {
      employee.bankDetails.ifscCode =
        employee.bankDetails.ifscCode.toUpperCase();
    }
  }
};

// ==========================================
// CREATE EMPLOYEE
// ==========================================
// const createEmployee = async (req, res) => {
//   try {
//     const { name, email, phone, password } = req.body;

//     if (!name || !email || !phone || !password) {
//       return res.status(400).json({
//         success: false,
//         message: "Name, email, phone and password are required",
//       });
//     }

//     const cleanName = cleanText(name);
//     const cleanEmail = cleanText(email).toLowerCase();
//     const cleanPhone = cleanText(phone);

//     if (!cleanName || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
//       return res.status(400).json({
//         success: false,
//         message: "Please provide a valid name and email",
//       });
//     }

//     if (!/^\d{10}$/.test(cleanPhone)) {
//       return res.status(400).json({
//         success: false,
//         message: "Phone number must contain exactly 10 digits",
//       });
//     }

//     if (typeof password !== "string" || password.trim().length < 6) {
//       return res.status(400).json({
//         success: false,
//         message: "Password must be at least 6 characters",
//       });
//     }

//     const existingEmployee = await User.findOne({
//       email: cleanEmail,
//     });

//     if (existingEmployee) {
//       return res.status(409).json({
//         success: false,
//         message: "User already exists with this email",
//       });
//     }

//     const employee = new User({
//       name: cleanName,
//       email: cleanEmail,
//       phone: cleanPhone,
//       password: password.trim(),
//       role: "employee",
//     });

//     readEmployeeFields(req.body, employee);
//     await employee.save();

//     return res.status(201).json({
//       success: true,
//       message: "Employee created successfully",
//       employee: getSafeEmployee(employee),
//     });
//   } catch (error) {
//     console.error("Create Employee Error:", error);

//     return res.status(400).json({
//       success: false,
//       message:
//         error.name === "ValidationError" ||
//         error.message === "Subjects must be an array of strings" ||
//         error.message === "Invalid bank details"
//           ? error.message
//           : "Unable to create employee",
//     });
//   }
// };

const createEmployee = async (req, res) => {
  try {
    const {
      name,
      email,
      phone,
      password,
      dateOfBirth,
      currentAddress,
      permanentAddress,
      qualification,
      specialization,
      designation,
      isClassTeacher,
      classTeacherClass,
      classTeacherSection,
      subjects,
      bankDetails,
    } = req.body;

    if (!name || !email || !phone || !password) {
      return res.status(400).json({
        success: false,
        message: "Name, email, phone and password are required",
      });
    }

    const cleanEmail = email.trim().toLowerCase();

    const existingEmployee = await User.findOne({
      email: cleanEmail,
    });

    if (existingEmployee) {
      return res.status(409).json({
        success: false,
        message: "User already exists with this email",
      });
    }

    const employee = await User.create({
      name: name.trim(),
      email: cleanEmail,
      phone: phone.trim(),
      password,
      role: "employee",

      dateOfBirth: dateOfBirth || null,
      currentAddress: currentAddress || "",
      permanentAddress: permanentAddress || "",
      qualification: qualification || "",
      specialization: specialization || "",
      designation: designation || "",

      isClassTeacher: Boolean(isClassTeacher),
      classTeacherClass: classTeacherClass || "",
      classTeacherSection: classTeacherSection || "",

      subjects: Array.isArray(subjects) ? subjects : [],

      bankDetails: {
        accountHolderName: bankDetails?.accountHolderName || "",
        bankName: bankDetails?.bankName || "",
        accountNumber: bankDetails?.accountNumber || "",
        ifscCode: bankDetails?.ifscCode || "",
        upiId: bankDetails?.upiId || "",
      },
    });

    return res.status(201).json({
      success: true,
      message: "Employee created successfully",
      employee: {
        _id: employee._id,
        name: employee.name,
        email: employee.email,
        phone: employee.phone,
      },
    });
  } catch (error) {
    console.error("Create Employee Error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// ==========================================
// GET ALL EMPLOYEES
// Bank account number, IFSC and UPI are excluded.
// ==========================================
const getEmployees = async (req, res) => {
  try {
    const employees = await User.find({ role: "employee" })
      .select(
        "name email phone role isActive dateOfBirth currentAddress permanentAddress qualification specialization designation isClassTeacher classTeacherClass classTeacherSection subjects createdAt updatedAt faceData",
      )
      .sort({ createdAt: -1 })
      .lean();

    const safeEmployees = employees.map(getSafeEmployee);

    return res.status(200).json({
      success: true,
      count: safeEmployees.length,
      employees: safeEmployees,
    });
  } catch (error) {
    console.error("Get Employees Error:", error);

    return res.status(500).json({
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

    if (!mongoose.Types.ObjectId.isValid(employeeId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid employee ID",
      });
    }

    let samples = [];

    if (Array.isArray(faceSamples) && faceSamples.length > 0) {
      samples = faceSamples;
    } else if (Array.isArray(faceData) && faceData.length === 128) {
      samples = [faceData];
    }

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
          (value) => typeof value !== "number" || !Number.isFinite(value),
        ),
    );

    if (invalidSample) {
      return res.status(400).json({
        success: false,
        message:
          "Every face sample must contain exactly 128 valid numeric values",
      });
    }

    if (samples.length > 5) {
      return res.status(400).json({
        success: false,
        message: "Maximum 5 face samples are allowed",
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

    employee.faceData = samples[0];
    employee.faceSamples = samples;

    await employee.save();

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
// const updateEmployee = async (req, res) => {
//   try {
//     const { employeeId } = req.params;
//     const { name, email, phone } = req.body;

//     if (!mongoose.Types.ObjectId.isValid(employeeId)) {
//       return res.status(400).json({
//         success: false,
//         message: "Invalid employee ID",
//       });
//     }

//     if (!name || !email || !phone) {
//       return res.status(400).json({
//         success: false,
//         message: "Name, email and phone are required",
//       });
//     }

//     const cleanName = cleanText(name);
//     const cleanEmail = cleanText(email).toLowerCase();
//     const cleanPhone = cleanText(phone);

//     if (!cleanName) {
//       return res.status(400).json({
//         success: false,
//         message: "Employee name is required",
//       });
//     }

//     if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
//       return res.status(400).json({
//         success: false,
//         message: "Invalid email address",
//       });
//     }

//     if (!/^\d{10}$/.test(cleanPhone)) {
//       return res.status(400).json({
//         success: false,
//         message: "Phone number must contain exactly 10 digits",
//       });
//     }

//     const existingUser = await User.findOne({
//       email: cleanEmail,
//       _id: { $ne: employeeId },
//     });

//     if (existingUser) {
//       return res.status(409).json({
//         success: false,
//         message: "Another user already exists with this email",
//       });
//     }

//     // Explicitly select protected bank fields for this admin-only route.
//     const employee = await User.findOne({
//       _id: employeeId,
//       role: "employee",
//     }).select(
//       "+bankDetails.accountNumber +bankDetails.ifscCode +bankDetails.upiId",
//     );

//     if (!employee) {
//       return res.status(404).json({
//         success: false,
//         message: "Employee not found",
//       });
//     }

//     employee.name = cleanName;
//     employee.email = cleanEmail;
//     employee.phone = cleanPhone;

//     readEmployeeFields(req.body, employee);

//     await employee.save();

//     return res.status(200).json({
//       success: true,
//       message: "Employee updated successfully",
//       employee: getSafeEmployee(employee),
//     });
//   } catch (error) {
//     console.error("Update Employee Error:", error);

//     return res.status(400).json({
//       success: false,
//       message:
//         error.name === "ValidationError" ||
//         error.message === "Subjects must be an array of strings" ||
//         error.message === "Invalid bank details"
//           ? error.message
//           : "Unable to update employee",
//     });
//   }
// };

const updateEmployee = async (req, res) => {
  try {
    const { employeeId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(employeeId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid employee ID",
      });
    }

    const {
      name,
      email,
      phone,
      dateOfBirth,
      currentAddress,
      permanentAddress,
      qualification,
      specialization,
      designation,
      isClassTeacher,
      classTeacherClass,
      classTeacherSection,
      subjects,
      bankDetails,
    } = req.body;

    if (!name?.trim() || !email?.trim() || !phone?.trim()) {
      return res.status(400).json({
        success: false,
        message: "Name, email and phone are required",
      });
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanPhone = phone.trim();

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

    employee.name = name.trim();
    employee.email = cleanEmail;
    employee.phone = cleanPhone;

    employee.dateOfBirth = dateOfBirth || null;
    employee.currentAddress = currentAddress || "";
    employee.permanentAddress = permanentAddress || "";
    employee.qualification = qualification || "";
    employee.specialization = specialization || "";
    employee.designation = designation || "";

    employee.isClassTeacher = Boolean(isClassTeacher);
    employee.classTeacherClass = classTeacherClass || "";
    employee.classTeacherSection = classTeacherSection || "";

    employee.subjects = Array.isArray(subjects) ? subjects : [];

    employee.bankDetails = {
      accountHolderName: bankDetails?.accountHolderName || "",
      bankName: bankDetails?.bankName || "",
      accountNumber: bankDetails?.accountNumber || "",
      ifscCode: bankDetails?.ifscCode || "",
      upiId: bankDetails?.upiId || "",
    };

    await employee.save();

    return res.status(200).json({
      success: true,
      message: "Employee updated successfully",
      employee: {
        _id: employee._id,
        id: employee._id,
        name: employee.name,
        email: employee.email,
        phone: employee.phone,
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
      employee: getSafeEmployee(employee),
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

    if (!mongoose.Types.ObjectId.isValid(employeeId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid employee ID",
      });
    }

    if (typeof newPassword !== "string" || newPassword.trim().length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 6 characters",
      });
    }

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

    employee.password = newPassword.trim();
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

// ==========================================
// GET EMPLOYEE DETAILS + ATTENDANCE SUMMARY
// Admin-only route. Bank fields are explicitly selected.
// ==========================================
// const getEmployeeDetails = async (req, res) => {
//   try {
//     const { employeeId } = req.params;

//     if (!mongoose.Types.ObjectId.isValid(employeeId)) {
//       return res.status(400).json({
//         success: false,
//         message: "Invalid employee ID",
//       });
//     }

//     const employee = await User.findOne({
//       _id: employeeId,
//       role: "employee",
//     }).select(
//       "name email phone role isActive dateOfBirth currentAddress permanentAddress qualification specialization designation isClassTeacher classTeacherClass classTeacherSection subjects faceData createdAt updatedAt bankDetails.accountHolderName bankDetails.bankName +bankDetails.accountNumber +bankDetails.ifscCode +bankDetails.upiId",
//     );

//     if (!employee) {
//       return res.status(404).json({
//         success: false,
//         message: "Employee not found",
//       });
//     }

//     const attendanceRecords = await Attendance.find({
//       employee: employeeId,
//     })
//       .sort({ date: -1 })
//       .lean();

//     let present = 0;
//     let late = 0;
//     let absent = 0;

//     attendanceRecords.forEach((record) => {
//       if (record.status === "late") late++;
//       else if (record.status === "present") present++;
//       else if (record.status === "absent") absent++;
//     });

//     const recentAttendance = attendanceRecords.slice(0, 5).map((record) => ({
//       id: record._id,
//       date: record.date,
//       status: record.status,
//       checkIn: record.checkIn,
//       checkOut: record.checkOut,
//       faceVerified: record.faceVerified,
//       checkInLocation: record.checkInLocation,
//       checkOutLocation: record.checkOutLocation,
//     }));

//     return res.status(200).json({
//       success: true,
//       employee: {
//         ...getSafeEmployee(employee),
//         bankDetails: getBankDetails(employee),
//         attendanceSummary: {
//           present,
//           late,
//           absent,
//           totalAttendanceRecords: attendanceRecords.length,
//         },
//         recentAttendance,
//       },
//     });
//   } catch (error) {
//     console.error("Get Employee Details Error:", error);

//     return res.status(500).json({
//       success: false,
//       message: "Server error",
//     });
//   }
// };

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
      "name email phone role isActive faceData createdAt updatedAt dateOfBirth currentAddress permanentAddress qualification specialization designation isClassTeacher classTeacherClass classTeacherSection subjects bankDetails",
    );

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: "Employee not found",
      });
    }

    const attendanceRecords = await Attendance.find({
      employee: employeeId,
    })
      .sort({ date: -1 })
      .lean();

    let present = 0;
    let late = 0;
    let absent = 0;

    attendanceRecords.forEach((record) => {
      if (record.status === "late") late++;
      else if (record.status === "present") present++;
      else if (record.status === "absent") absent++;
    });

    const recentAttendance = attendanceRecords.slice(0, 5).map((record) => ({
      id: record._id,
      date: record.date,
      status: record.status,
      checkIn: record.checkIn,
      checkOut: record.checkOut,
      faceVerified: record.faceVerified,
      checkInLocation: record.checkInLocation,
      checkOutLocation: record.checkOutLocation,
    }));

    return res.status(200).json({
      success: true,
      employee: {
        _id: employee._id,
        id: employee._id,
        name: employee.name,
        email: employee.email,
        phone: employee.phone,
        role: employee.role,
        isActive: employee.isActive,

        dateOfBirth: employee.dateOfBirth,
        currentAddress: employee.currentAddress,
        permanentAddress: employee.permanentAddress,
        qualification: employee.qualification,
        specialization: employee.specialization,
        designation: employee.designation,

        isClassTeacher: employee.isClassTeacher,
        classTeacherClass: employee.classTeacherClass,
        classTeacherSection: employee.classTeacherSection,
        subjects: employee.subjects || [],
        bankDetails: employee.bankDetails || {},

        faceRegistered:
          Array.isArray(employee.faceData) && employee.faceData.length === 128,

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
