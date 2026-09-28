const Attendance = require("../models/Attendance");
const School = require("../models/School");
const calculateDistance = require("../utils/distance");
const User = require("../models/User");
const { isFaceMatch } = require("../utils/faceMatch");

// ==========================================
// CHECK IN
// ==========================================
const checkIn = async (req, res) => {
  try {
    const { latitude, longitude, accuracy, faceDescriptor } = req.body;
    // Only employee can check in
    if (req.user.role !== "employee") {
      return res.status(403).json({
        success: false,
        message: "Only employees can mark attendance",
      });
    }

    // Validate GPS
    if (latitude === undefined || longitude === undefined) {
      return res.status(400).json({
        success: false,
        message: "Location is required",
      });
    }

    const employeeLatitude = Number(latitude);
    const employeeLongitude = Number(longitude);

    if (
      !Number.isFinite(employeeLatitude) ||
      !Number.isFinite(employeeLongitude)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid GPS coordinates",
      });
    }

    // Validate face descriptor
    if (!Array.isArray(faceDescriptor) || faceDescriptor.length !== 128) {
      return res.status(400).json({
        success: false,
        message: "Valid face descriptor is required",
      });
    }

    // Get active school
    const school = await School.findOne({
      isActive: true,
    });

    if (!school) {
      return res.status(404).json({
        success: false,
        message: "School location not configured",
      });
    }

    const gpsAccuracy = Number(accuracy);
    console.log("GPS Accuracy:", gpsAccuracy);
    console.log("School GPS Accuracy Limit:", school.gpsAccuracyLimit);

    if (!Number.isFinite(gpsAccuracy)) {
      return res.status(400).json({
        success: false,
        message: "Valid GPS accuracy is required",
      });
    }

    if (gpsAccuracy > school.gpsAccuracyLimit) {
      return res.status(403).json({
        success: false,
        message: "GPS accuracy is too low",
        accuracy: Math.round(gpsAccuracy),
        requiredAccuracy: school.gpsAccuracyLimit,
        suggestion: "Please enable Precise Location and try again.",
      });
    }

    // Calculate distance
    const distance = calculateDistance(
      employeeLatitude,
      employeeLongitude,
      school.latitude,
      school.longitude,
    );

    // Get employee with registered face
    const employee = await User.findById(req.user._id);

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: "Employee not found",
      });
    }

    if (!Array.isArray(employee.faceData) || employee.faceData.length !== 128) {
      return res.status(400).json({
        success: false,
        message: "Employee face is not registered",
      });
    }

    // Face verification
    const faceResult = isFaceMatch(employee.faceData, faceDescriptor);

    console.log("Face Verification:", faceResult);

    if (!faceResult.matched) {
      return res.status(403).json({
        success: false,
        message: "Face verification failed",
        distance: faceResult.distance,
      });
    }

    // Geofence check
    if (distance > school.radius) {
      return res.status(403).json({
        success: false,
        message: "You are outside the school area",
        distance: Math.round(distance),
        allowedRadius: school.radius,
      });
    }

    // Current date
    const today = new Date().toISOString().split("T")[0];

    // Check existing attendance
    const existingAttendance = await Attendance.findOne({
      employee: req.user._id,
      date: today,
    });

    if (existingAttendance) {
      return res.status(409).json({
        success: false,
        message: "Attendance already marked for today",
      });
    }

    // Create attendance
    const attendance = await Attendance.create({
      employee: req.user._id,
      date: today,
      checkIn: new Date(),

      checkInLocation: {
        latitude: employeeLatitude,
        longitude: employeeLongitude,
      },

      faceVerified: true,
      status: "present",
    });

    res.status(201).json({
      success: true,
      message: "Attendance marked successfully",
      attendance,
    });
  } catch (error) {
    console.error("Check In Error:", error);

    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// ==========================================
// CHECK OUT
// ==========================================
const checkOut = async (req, res) => {
  try {
    // const { latitude, longitude } = req.body;
    const { latitude, longitude, accuracy } = req.body;

    // Only employee
    if (req.user.role !== "employee") {
      return res.status(403).json({
        success: false,
        message: "Only employees can check out",
      });
    }

    // Validate GPS
    if (latitude === undefined || longitude === undefined) {
      return res.status(400).json({
        success: false,
        message: "Location is required",
      });
    }

    const employeeLatitude = Number(latitude);
    const employeeLongitude = Number(longitude);

    if (
      !Number.isFinite(employeeLatitude) ||
      !Number.isFinite(employeeLongitude)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid GPS coordinates",
      });
    }

    // Validate GPS accuracy
    const gpsAccuracy = Number(accuracy);

    if (!Number.isFinite(gpsAccuracy)) {
      return res.status(400).json({
        success: false,
        message: "Valid GPS accuracy is required",
      });
    }

    // Get active school
    const school = await School.findOne({
      isActive: true,
    });

    if (!school) {
      return res.status(404).json({
        success: false,
        message: "School location not configured",
      });
    }

    // GPS accuracy check
    if (gpsAccuracy > school.gpsAccuracyLimit) {
      return res.status(403).json({
        success: false,
        message: "GPS accuracy is too low",
        accuracy: Math.round(gpsAccuracy),
        requiredAccuracy: school.gpsAccuracyLimit,
        suggestion: "Please enable Precise Location and try again.",
      });
    }

    // Calculate distance
    const distance = calculateDistance(
      employeeLatitude,
      employeeLongitude,
      school.latitude,
      school.longitude,
    );

    // Geofence check
    if (distance > school.radius) {
      return res.status(403).json({
        success: false,
        message: "You are outside the school area",
        distance: Math.round(distance),
        allowedRadius: school.radius,
      });
    }

    // Today's date
    const today = new Date().toISOString().split("T")[0];

    // Find today's attendance
    const attendance = await Attendance.findOne({
      employee: req.user._id,
      date: today,
    });

    if (!attendance) {
      return res.status(404).json({
        success: false,
        message: "Check-in not found for today",
      });
    }

    // Already checked out
    if (attendance.checkOut) {
      return res.status(409).json({
        success: false,
        message: "You have already checked out",
      });
    }

    // Save checkout
    attendance.checkOut = new Date();

    attendance.checkOutLocation = {
      latitude: employeeLatitude,
      longitude: employeeLongitude,
    };

    await attendance.save();

    res.status(200).json({
      success: true,
      message: "Check-out successful",
      attendance,
    });
  } catch (error) {
    console.error("Check Out Error:", error);

    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// ==========================================
// GET MY ATTENDANCE
// ==========================================
const getMyAttendance = async (req, res) => {
  try {
    const attendance = await Attendance.find({
      employee: req.user._id,
    })
      .sort({ date: -1 })
      .populate("employee", "name email phone");

    res.status(200).json({
      success: true,
      count: attendance.length,
      attendance,
    });
  } catch (error) {
    console.error("Get My Attendance Error:", error);

    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// ==========================================
// ADMIN DASHBOARD STATS
// ==========================================
const getAdminDashboardStats = async (req, res) => {
  try {
    // Only admin
    if (req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Only admin can access dashboard statistics",
      });
    }

    // Today's date
    const today = new Date().toISOString().split("T")[0];

    // Total active employees
    const totalEmployees = await User.countDocuments({
      role: "employee",
      isActive: true,
    });

    // Today's attendance
    const todayAttendance = await Attendance.find({
      date: today,
    }).select("employee checkIn checkOut status");

    // Present
    const presentToday = todayAttendance.filter(
      (item) => item.status === "present" || item.status === "late",
    ).length;

    // Late
    const lateToday = todayAttendance.filter(
      (item) => item.status === "late",
    ).length;

    // Currently checked in
    const currentlyCheckedIn = todayAttendance.filter(
      (item) => item.checkIn && !item.checkOut,
    ).length;

    // Checked out
    const checkedOutToday = todayAttendance.filter(
      (item) => !!item.checkOut,
    ).length;

    // Employees without attendance
    const absentToday = Math.max(totalEmployees - presentToday, 0);

    res.status(200).json({
      success: true,

      date: today,

      stats: {
        totalEmployees,
        presentToday,
        absentToday,
        lateToday,
        currentlyCheckedIn,
        checkedOutToday,
      },
    });
  } catch (error) {
    console.error("Get Admin Dashboard Stats Error:", error);

    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

module.exports = {
  checkIn,
  checkOut,
  getMyAttendance,
  getAdminDashboardStats,
};
