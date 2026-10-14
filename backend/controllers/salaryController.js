const Salary = require("../models/Salary");
const User = require("../models/User");
const { sendSalaryEmail } = require("../services/emailService");

// Email failure should not fail the salary API
const notifySalaryEmail = async (emailData) => {
  try {
    const result = await sendSalaryEmail(emailData);

    if (!result?.success) {
      console.error(
        "Salary email was not sent:",
        result?.message || "Unknown email error"
      );
    }
  } catch (error) {
    console.error("Salary email error:", error.message);
  }
};

// CREATE SALARY
const createSalary = async (req, res) => {
  try {
    const {
      employeeId,
      month,
      year,
      basicSalary,
      allowances = 0,
      deductions = 0,
      status = "Pending",
      paymentDate = null,
      paymentMethod = "Other",
      transactionReference = "",
      remarks = "",
    } = req.body;

    if (
      !employeeId ||
      month === undefined ||
      year === undefined ||
      basicSalary === undefined
    ) {
      return res.status(400).json({
        success: false,
        message: "Employee, month, year and basic salary are required.",
      });
    }

    const monthNumber = Number(month);
    const yearNumber = Number(year);
    const basic = Number(basicSalary);
    const allowanceAmount = Number(allowances);
    const deductionAmount = Number(deductions);

    if (
      !Number.isInteger(monthNumber) ||
      monthNumber < 1 ||
      monthNumber > 12 ||
      !Number.isInteger(yearNumber) ||
      !Number.isFinite(basic) ||
      !Number.isFinite(allowanceAmount) ||
      !Number.isFinite(deductionAmount) ||
      basic < 0 ||
      allowanceAmount < 0 ||
      deductionAmount < 0 ||
      basic + allowanceAmount - deductionAmount < 0
    ) {
      return res.status(400).json({
        success: false,
        message: "Please provide valid salary details.",
      });
    }

    if (!["Pending", "Paid"].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Status must be Pending or Paid.",
      });
    }

    const employee = await User.findById(employeeId);

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: "Employee not found.",
      });
    }

    if (employee.role !== "employee" || employee.isActive === false) {
      return res.status(400).json({
        success: false,
        message: "Selected user is not an active employee.",
      });
    }

    const existingSalary = await Salary.findOne({
      employee: employeeId,
      month: monthNumber,
      year: yearNumber,
    });

    if (existingSalary) {
      return res.status(409).json({
        success: false,
        message: "Salary record already exists for this employee and month.",
      });
    }

    const netSalary = basic + allowanceAmount - deductionAmount;

    const salary = await Salary.create({
      employee: employeeId,
      month: monthNumber,
      year: yearNumber,
      basicSalary: basic,
      allowances: allowanceAmount,
      deductions: deductionAmount,
      netSalary,
      status,
      paymentDate: status === "Paid" ? paymentDate || new Date() : null,
      paymentMethod,
      transactionReference,
      remarks,
      createdBy: req.user._id,
    });

    const populatedSalary = await Salary.findById(salary._id)
      .populate("employee", "name email")
      .populate("createdBy", "name email");

    await notifySalaryEmail({
      to: populatedSalary.employee.email,
      employeeName: populatedSalary.employee.name,
      month: populatedSalary.month,
      year: populatedSalary.year,
      netSalary: populatedSalary.netSalary,
      status: populatedSalary.status,
      paymentDate: populatedSalary.paymentDate,
      paymentMethod: populatedSalary.paymentMethod,
      transactionReference: populatedSalary.transactionReference,
    });

    return res.status(201).json({
      success: true,
      message: "Salary record created successfully.",
      salary: populatedSalary,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "Salary record already exists for this employee and month.",
      });
    }

    console.error("Create salary error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to create salary record.",
    });
  }
};

// GET ALL SALARIES (ADMIN)
const getAllSalaries = async (req, res) => {
  try {
    const { month, year, status, employeeId } = req.query;
    const filter = {};

    if (month !== undefined) filter.month = Number(month);
    if (year !== undefined) filter.year = Number(year);
    if (status) filter.status = status;
    if (employeeId) filter.employee = employeeId;

    const salaries = await Salary.find(filter)
      .populate("employee", "name email phone")
      .populate("createdBy", "name email")
      .sort({ year: -1, month: -1, createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: salaries.length,
      salaries,
    });
  } catch (error) {
    console.error("Get salaries error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch salary records.",
    });
  }
};

// GET LOGGED-IN EMPLOYEE'S SALARIES
const getMySalaries = async (req, res) => {
  try {
    const salaries = await Salary.find({
      employee: req.user._id,
    }).sort({ year: -1, month: -1 });

    return res.status(200).json({
      success: true,
      count: salaries.length,
      salaries,
    });
  } catch (error) {
    console.error("Get my salaries error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch your salary records.",
    });
  }
};

// UPDATE SALARY (ADMIN)
const updateSalary = async (req, res) => {
  try {
    const salary = await Salary.findById(req.params.id);

    // Check record before accessing its properties
    if (!salary) {
      return res.status(404).json({
        success: false,
        message: "Salary record not found.",
      });
    }

    const previousStatus = salary.status;

    const {
      basicSalary,
      allowances,
      deductions,
      status,
      paymentDate,
      paymentMethod,
      transactionReference,
      remarks,
    } = req.body;

    const updates = {};

    if (basicSalary !== undefined) {
      updates.basicSalary = Number(basicSalary);
    }

    if (allowances !== undefined) {
      updates.allowances = Number(allowances);
    }

    if (deductions !== undefined) {
      updates.deductions = Number(deductions);
    }

    const finalBasic =
      updates.basicSalary ?? salary.basicSalary;
    const finalAllowances =
      updates.allowances ?? salary.allowances;
    const finalDeductions =
      updates.deductions ?? salary.deductions;

    if (
      !Number.isFinite(finalBasic) ||
      !Number.isFinite(finalAllowances) ||
      !Number.isFinite(finalDeductions) ||
      finalBasic < 0 ||
      finalAllowances < 0 ||
      finalDeductions < 0 ||
      finalBasic + finalAllowances - finalDeductions < 0
    ) {
      return res.status(400).json({
        success: false,
        message: "Please provide valid salary amounts.",
      });
    }

    updates.netSalary =
      finalBasic + finalAllowances - finalDeductions;

    if (status !== undefined) {
      if (!["Pending", "Paid"].includes(status)) {
        return res.status(400).json({
          success: false,
          message: "Status must be Pending or Paid.",
        });
      }

      updates.status = status;

      if (status === "Paid" && previousStatus !== "Paid") {
        updates.paymentDate = paymentDate || new Date();
      } else if (status === "Pending") {
        updates.paymentDate = null;
      }
    }

    if (paymentDate !== undefined && status !== "Pending") {
      updates.paymentDate = paymentDate || null;
    }

    if (paymentMethod !== undefined) {
      updates.paymentMethod = paymentMethod;
    }

    if (transactionReference !== undefined) {
      updates.transactionReference = transactionReference;
    }

    if (remarks !== undefined) {
      updates.remarks = remarks;
    }

    Object.assign(salary, updates);
    await salary.save();

    const updatedSalary = await Salary.findById(salary._id)
      .populate("employee", "name email")
      .populate("createdBy", "name email");

    // Send an email only when the payment status changes
    if (previousStatus !== updatedSalary.status) {
      await notifySalaryEmail({
        to: updatedSalary.employee.email,
        employeeName: updatedSalary.employee.name,
        month: updatedSalary.month,
        year: updatedSalary.year,
        netSalary: updatedSalary.netSalary,
        status: updatedSalary.status,
        paymentDate: updatedSalary.paymentDate,
        paymentMethod: updatedSalary.paymentMethod,
        transactionReference: updatedSalary.transactionReference,
      });
    }

    return res.status(200).json({
      success: true,
      message: "Salary record updated successfully.",
      salary: updatedSalary,
    });
  } catch (error) {
    console.error("Update salary error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to update salary record.",
    });
  }
};

module.exports = {
  createSalary,
  getAllSalaries,
  getMySalaries,
  updateSalary,
};
