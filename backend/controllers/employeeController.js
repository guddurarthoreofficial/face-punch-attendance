const User = require("../models/User");

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
    }).select("-password");

    res.status(200).json({
      success: true,
      count: employees.length,
      employees,
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
// const registerEmployeeFace = async (req, res) => {
//   try {
//     const { employeeId } = req.params;
//     const { faceData } = req.body;

//     if (!Array.isArray(faceData) || faceData.length === 0) {
//       return res.status(400).json({
//         success: false,
//         message: "Valid face data is required",
//       });
//     }

//     const employee = await User.findOne({
//       _id: employeeId,
//       role: "employee",
//     });

//     if (!employee) {
//       return res.status(404).json({
//         success: false,
//         message: "Employee not found",
//       });
//     }

//     employee.faceData = faceData;

//     await employee.save();

//     res.status(200).json({
//       success: true,
//       message: "Employee face registered successfully",
//       employee: {
//         id: employee._id,
//         name: employee.name,
//         email: employee.email,
//         faceRegistered: true,
//       },
//     });
//   } catch (error) {
//     console.error(
//       "Register Employee Face Error:",
//       error
//     );

//     res.status(500).json({
//       success: false,
//       message: "Server error",
//     });
//   }
// };



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
    console.error(
      "Register Employee Face Error:",
      error
    );

    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

module.exports = {
  createEmployee,
  getEmployees,
  registerEmployeeFace,
};