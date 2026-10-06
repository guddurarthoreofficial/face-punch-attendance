const Attendance = require("../models/Attendance");
const School = require("../models/School");
const calculateDistance = require("../utils/distance");
const User = require("../models/User");
const { isFaceMatch, isFaceMatchMultiple } = require("../utils/faceMatch");
const { getWorkingDates } = require("../utils/workingDays");

const {
  getIndiaDateString,
  getIndiaTimeMinutes,
} = require("../utils/indiaTime");

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

    // Safe attendance rules
    const attendanceRules = school.attendanceRules || {
      checkInTime: "09:00",
      lateAfterMinutes: 15,
      minimumWorkingHours: 8,
      allowEarlyCheckout: false,
    };

    // Validate GPS accuracy
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

    // Check registered face

    // ==========================================
    // FACE VERIFICATION
    // ==========================================

    let faceResult;

    // New system: compare against multiple face samples
    if (
      Array.isArray(employee.faceSamples) &&
      employee.faceSamples.length > 0
    ) {
      faceResult = isFaceMatchMultiple(employee.faceSamples, faceDescriptor);

      console.log("Multi-Sample Face Verification:", faceResult);
    }

    // Backward compatibility: old employees
    else if (
      Array.isArray(employee.faceData) &&
      employee.faceData.length === 128
    ) {
      faceResult = isFaceMatch(employee.faceData, faceDescriptor);

      console.log("Legacy Face Verification:", faceResult);
    }

    // No registered face
    else {
      return res.status(400).json({
        success: false,
        message: "Employee face is not registered",
      });
    }

    // Face verification failed
    if (!faceResult.matched) {
      return res.status(403).json({
        success: false,
        message: "Face verification failed",
        distance: faceResult.distance,
        threshold: faceResult.threshold,
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
    // const today = new Date().toISOString().split("T")[0];
    const today = getIndiaDateString();

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

    // Current time
    const now = new Date();

    const currentIndiaMinutes = getIndiaTimeMinutes(now);

    const [checkInHours, checkInMinutes] = attendanceRules.checkInTime
      .split(":")
      .map(Number);

    const officialCheckInMinutes = checkInHours * 60 + checkInMinutes;

    if (currentIndiaMinutes < officialCheckInMinutes) {
      return res.status(403).json({
        success: false,
        message: "Attendance cannot be marked before check-in time",
        currentTime: `${String(Math.floor(currentIndiaMinutes / 60)).padStart(
          2,
          "0",
        )}:${String(currentIndiaMinutes % 60).padStart(2, "0")}`,
        checkInTime: attendanceRules.checkInTime,
      });
    }

    const lateLimitMinutes =
      officialCheckInMinutes + Number(attendanceRules.lateAfterMinutes);

    const attendanceStatus =
      currentIndiaMinutes > lateLimitMinutes ? "late" : "present";

    console.log("India Current Minutes:", currentIndiaMinutes);
    console.log("Official Check-In Minutes:", officialCheckInMinutes);
    console.log("Late Limit Minutes:", lateLimitMinutes);

    console.log("Attendance Status:", attendanceStatus);

    // Create attendance
    const attendance = await Attendance.create({
      employee: req.user._id,

      date: today,

      checkIn: now,

      checkInLocation: {
        latitude: employeeLatitude,
        longitude: employeeLongitude,
      },

      faceVerified: true,

      status: attendanceStatus,
    });

    return res.status(201).json({
      success: true,
      message:
        attendanceStatus === "late"
          ? "Attendance marked successfully. You are late."
          : "Attendance marked successfully",
      attendance,
    });
  } catch (error) {
    console.error("Check In Error:", error);

    // Duplicate attendance protection
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "Attendance already marked for today",
      });
    }

    return res.status(500).json({
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
    const { latitude, longitude, accuracy } = req.body;

    // Only employee can check out
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

    // Safe attendance rules
    const attendanceRules = school.attendanceRules || {
      checkInTime: "09:00",
      lateAfterMinutes: 15,
      minimumWorkingHours: 8,
      allowEarlyCheckout: false,
    };

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
    // const today = new Date().toISOString().split("T")[0];
    const today = getIndiaDateString();

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

    // Calculate working hours
    const checkOutTime = new Date();

    const workingMilliseconds =
      checkOutTime.getTime() - new Date(attendance.checkIn).getTime();

    const workingHours = workingMilliseconds / (1000 * 60 * 60);

    const minimumWorkingHours = attendanceRules.minimumWorkingHours;

    // Early checkout protection
    if (
      workingHours < minimumWorkingHours &&
      !attendanceRules.allowEarlyCheckout
    ) {
      return res.status(403).json({
        success: false,
        message: "Minimum working hours not completed",
        workedHours: Number(workingHours.toFixed(2)),
        requiredHours: minimumWorkingHours,
        suggestion:
          "Please complete the required working hours before checking out.",
      });
    }

    // Save checkout
    attendance.checkOut = checkOutTime;

    attendance.checkOutLocation = {
      latitude: employeeLatitude,
      longitude: employeeLongitude,
    };

    await attendance.save();

    return res.status(200).json({
      success: true,
      message: "Check-out successful",
      attendance,
      workingHours: Number(workingHours.toFixed(2)),
    });
  } catch (error) {
    console.error("Check Out Error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// ==========================================
// GET MY TODAY'S ATTENDANCE
// ==========================================
const getMyTodayAttendance = async (req, res) => {
  try {
    // Only employee
    if (req.user.role !== "employee") {
      return res.status(403).json({
        success: false,
        message: "Only employees can access today's attendance",
      });
    }

    // Today's date
    // const today = new Date().toISOString().split("T")[0];
    const today = getIndiaDateString();

    const attendance = await Attendance.findOne({
      employee: req.user._id,
      date: today,
    }).select(
      "date checkIn checkOut checkInLocation checkOutLocation faceVerified status",
    );

    res.status(200).json({
      success: true,
      date: today,
      attendance: attendance || null,
    });
  } catch (error) {
    console.error("Get My Today Attendance Error:", error);

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
    if (req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Only admin can access dashboard stats",
      });
    }

    // ==========================================
    // TODAY - INDIA DATE
    // ==========================================

    const today = getIndiaDateString();

    // ==========================================
    // GET ACTIVE SCHOOL
    // ==========================================

    const school = await School.findOne({
      isActive: true,
    });

    if (!school) {
      return res.status(404).json({
        success: false,
        message: "Active school not found",
      });
    }

    const weeklyOffDays =
      Array.isArray(school.weeklyOffDays) && school.weeklyOffDays.length > 0
        ? school.weeklyOffDays
        : [0];

    const holidays = Array.isArray(school.holidays) ? school.holidays : [];

    // ==========================================
    // CHECK WHETHER TODAY IS WORKING DAY
    // ==========================================

    const todayWorkingDates = getWorkingDates(
      today,
      today,
      weeklyOffDays,
      holidays,
    );

    const isTodayWorkingDay = todayWorkingDates.includes(today);

    // ==========================================
    // GET ACTIVE EMPLOYEES
    // ==========================================

    const activeEmployees = await User.find({
      role: "employee",
      isActive: true,
    }).select("_id");

    const activeEmployeeIds = activeEmployees.map((employee) => employee._id);

    const totalEmployees = activeEmployeeIds.length;

    const todayAttendance = await Attendance.find({
      date: today,
      employee: {
        $in: activeEmployeeIds,
      },
    });
    // ==========================================
    // GET TODAY ATTENDANCE
    // ==========================================

    // ==========================================
    // PRESENT
    // ==========================================

    const presentToday = todayAttendance.filter(
      (record) => record.status === "present",
    ).length;

    // ==========================================
    // LATE
    // ==========================================

    const lateToday = todayAttendance.filter(
      (record) => record.status === "late",
    ).length;

    // ==========================================
    // CHECKED OUT
    // ==========================================

    const checkedOutToday = todayAttendance.filter(
      (record) => !!record.checkOut,
    ).length;

    // ==========================================
    // CURRENTLY CHECKED IN
    // ==========================================

    const currentlyCheckedIn = todayAttendance.filter(
      (record) => record.checkIn && !record.checkOut,
    ).length;

    // ==========================================
    // REAL ABSENT
    // ==========================================

    let absentToday = 0;

    if (isTodayWorkingDay) {
      absentToday = Math.max(totalEmployees - todayAttendance.length, 0);
    }

    // ==========================================
    // RESPONSE
    // ==========================================

    return res.status(200).json({
      success: true,

      date: today,

      isWorkingDay: isTodayWorkingDay,

      weeklyOffDays,

      holiday: holidays.find((holiday) => holiday.date === today) || null,

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

    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// ==========================================
// ADMIN TODAY'S ATTENDANCE
// ==========================================
const getAdminTodayAttendance = async (req, res) => {
  try {
    // Only admin
    if (req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Only admin can access today's attendance",
      });
    }

    // Today's date
    // const today = new Date().toISOString().split("T")[0];
    const today = getIndiaDateString();

    const attendance = await Attendance.find({
      date: today,
    })
      .sort({ checkIn: 1 })
      .populate("employee", "name email phone");

    res.status(200).json({
      success: true,
      date: today,
      count: attendance.length,
      attendance,
    });
  } catch (error) {
    console.error("Get Admin Today Attendance Error:", error);

    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// const getAdminAttendance = async (req, res) => {
//   try {
//     if (req.user.role !== "admin") {
//       return res.status(403).json({
//         success: false,
//         message: "Only admin can access attendance",
//       });
//     }

//     const { date, search = "", status = "all" } = req.query;

//     // const selectedDate = date || new Date().toISOString().split("T")[0];
//     const selectedDate = date || getIndiaDateString();

//     const employees = await User.find({
//       role: "employee",
//       isActive: true,
//       ...(search
//         ? {
//             $or: [
//               {
//                 name: {
//                   $regex: search,
//                   $options: "i",
//                 },
//               },
//               {
//                 email: {
//                   $regex: search,
//                   $options: "i",
//                 },
//               },
//             ],
//           }
//         : {}),
//     }).select("_id name email phone");

//     const attendanceRecords = await Attendance.find({
//       date: selectedDate,
//     });

//     const attendanceMap = new Map();

//     attendanceRecords.forEach((record) => {
//       attendanceMap.set(record.employee.toString(), record);
//     });

//     let attendance = employees.map((employee) => {
//       const record = attendanceMap.get(employee._id.toString());

//       return {
//         employee: {
//           id: employee._id,
//           name: employee.name,
//           email: employee.email,
//           phone: employee.phone,
//         },

//         attendance: record
//           ? {
//               id: record._id,
//               date: record.date,
//               checkIn: record.checkIn,
//               checkOut: record.checkOut,
//               status: record.status,
//               faceVerified: record.faceVerified,
//             }
//           : null,

//         status: record ? record.status : "absent",
//       };
//     });

//     if (status !== "all") {
//       attendance = attendance.filter((item) => item.status === status);
//     }

//     res.status(200).json({
//       success: true,
//       date: selectedDate,
//       count: attendance.length,
//       attendance,
//     });
//   } catch (error) {
//     console.error("Get Admin Attendance Error:", error);

//     res.status(500).json({
//       success: false,
//       message: "Server error",
//     });
//   }
// };

// ==========================================
// ADMIN ATTENDANCE - DAILY REPORT
// ==========================================
const getAdminAttendance = async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Only admin can access attendance",
      });
    }

    const { date, search = "", status = "all" } = req.query;

    const selectedDate = date || getIndiaDateString();

    // ==========================================
    // GET ACTIVE SCHOOL
    // ==========================================

    const school = await School.findOne({
      isActive: true,
    });

    if (!school) {
      return res.status(404).json({
        success: false,
        message: "Active school not found",
      });
    }

    // ==========================================
    // SCHOOL WORKING RULES
    // ==========================================

    const weeklyOffDays =
      Array.isArray(school.weeklyOffDays) && school.weeklyOffDays.length > 0
        ? school.weeklyOffDays
        : [0];

    const holidays = Array.isArray(school.holidays) ? school.holidays : [];

    // ==========================================
    // CHECK WORKING DAY
    // ==========================================

    const workingDates = getWorkingDates(
      selectedDate,
      selectedDate,
      weeklyOffDays,
      holidays,
    );

    const isWorkingDay = workingDates.includes(selectedDate);

    // ==========================================
    // GET ACTIVE EMPLOYEES
    // ==========================================

    const employees = await User.find({
      role: "employee",
      isActive: true,

      ...(search.trim()
        ? {
            $or: [
              {
                name: {
                  $regex: search.trim(),
                  $options: "i",
                },
              },
              {
                email: {
                  $regex: search.trim(),
                  $options: "i",
                },
              },
              {
                phone: {
                  $regex: search.trim(),
                  $options: "i",
                },
              },
            ],
          }
        : {}),
    }).select("_id name email phone");

    // ==========================================
    // GET ATTENDANCE
    // ==========================================

    const attendanceRecords = await Attendance.find({
      date: selectedDate,

      employee: {
        $in: employees.map((employee) => employee._id),
      },
    });

    // ==========================================
    // ATTENDANCE MAP
    // ==========================================

    const attendanceMap = new Map();

    attendanceRecords.forEach((record) => {
      attendanceMap.set(record.employee.toString(), record);
    });

    // ==========================================
    // MERGE EMPLOYEES + ATTENDANCE
    // ==========================================

    let attendance = employees.map((employee) => {
      const record = attendanceMap.get(employee._id.toString());

      let workingHours = null;

      // Calculate working hours
      if (record && record.checkIn && record.checkOut) {
        const milliseconds =
          new Date(record.checkOut).getTime() -
          new Date(record.checkIn).getTime();

        workingHours = Number((milliseconds / (1000 * 60 * 60)).toFixed(2));
      }

      // ==========================================
      // STATUS
      // ==========================================

      let employeeStatus;

      if (record) {
        employeeStatus = record.status;
      } else if (isWorkingDay) {
        employeeStatus = "absent";
      } else {
        // Weekly off / holiday
        employeeStatus = "off";
      }

      return {
        employee: {
          id: employee._id,
          name: employee.name,
          email: employee.email,
          phone: employee.phone,
        },

        attendance: record
          ? {
              id: record._id,

              date: record.date,

              checkIn: record.checkIn,

              checkOut: record.checkOut,

              workingHours,

              status: record.status,

              faceVerified: record.faceVerified,

              checkInLocation: record.checkInLocation,

              checkOutLocation: record.checkOutLocation,
            }
          : null,

        status: employeeStatus,
      };
    });

    // ==========================================
    // STATUS FILTER
    // ==========================================

    if (status !== "all") {
      attendance = attendance.filter((item) => item.status === status);
    }

    // ==========================================
    // SUMMARY
    // ==========================================

    const summary = {
      totalEmployees: employees.length,

      present: attendance.filter((item) => item.status === "present").length,

      late: attendance.filter((item) => item.status === "late").length,

      absent: attendance.filter((item) => item.status === "absent").length,

      checkedOut: attendance.filter(
        (item) => item.attendance && item.attendance.checkOut,
      ).length,
    };

    // ==========================================
    // RESPONSE
    // ==========================================

    return res.status(200).json({
      success: true,

      date: selectedDate,

      isWorkingDay,

      weeklyOffDays,

      holiday:
        holidays.find((holiday) => holiday.date === selectedDate) || null,

      summary,

      count: attendance.length,

      attendance,
    });
  } catch (error) {
    console.error("Get Admin Attendance Error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// ==========================================
// ADMIN DATE RANGE REPORT
// ==========================================
const getAdminAttendanceReport = async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Only admin can access attendance reports",
      });
    }

    const { startDate, endDate, search = "" } = req.query;

    // ==========================================
    // VALIDATION
    // ==========================================

    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: "startDate and endDate are required",
      });
    }

    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;

    if (!dateRegex.test(startDate) || !dateRegex.test(endDate)) {
      return res.status(400).json({
        success: false,
        message: "Invalid date format. Use YYYY-MM-DD",
      });
    }

    if (startDate > endDate) {
      return res.status(400).json({
        success: false,
        message: "startDate cannot be greater than endDate",
      });
    }

    // ==========================================
    // GET SCHOOL SETTINGS
    // ==========================================

    const school = await School.findOne({
      isActive: true,
    });

    if (!school) {
      return res.status(404).json({
        success: false,
        message: "Active school not found",
      });
    }

    const weeklyOffDays =
      Array.isArray(school.weeklyOffDays) && school.weeklyOffDays.length > 0
        ? school.weeklyOffDays
        : [0];

    const holidays = Array.isArray(school.holidays) ? school.holidays : [];

    // ==========================================
    // GET WORKING DATES
    // ==========================================

    const workingDates = getWorkingDates(
      startDate,
      endDate,
      weeklyOffDays,
      holidays,
    );

    const workingDays = workingDates.length;

    // ==========================================
    // GET ACTIVE EMPLOYEES
    // ==========================================

    const employees = await User.find({
      role: "employee",
      isActive: true,

      ...(search.trim()
        ? {
            $or: [
              {
                name: {
                  $regex: search.trim(),
                  $options: "i",
                },
              },
              {
                email: {
                  $regex: search.trim(),
                  $options: "i",
                },
              },
              {
                phone: {
                  $regex: search.trim(),
                  $options: "i",
                },
              },
            ],
          }
        : {}),
    }).select("_id name email phone");

    // ==========================================
    // GET ATTENDANCE RECORDS
    // ==========================================

    const attendanceRecords = await Attendance.find({
      date: {
        $gte: startDate,
        $lte: endDate,
      },

      employee: {
        $in: employees.map((employee) => employee._id),
      },
    }).sort({
      date: 1,
      checkIn: 1,
    });

    // ==========================================
    // GROUP ATTENDANCE BY EMPLOYEE
    // ==========================================

    const attendanceMap = new Map();

    attendanceRecords.forEach((record) => {
      const employeeId = record.employee.toString();

      if (!attendanceMap.has(employeeId)) {
        attendanceMap.set(employeeId, []);
      }

      attendanceMap.get(employeeId).push(record);
    });

    // ==========================================
    // EMPLOYEE REPORT
    // ==========================================

    const employeeReports = employees.map((employee) => {
      const records = attendanceMap.get(employee._id.toString()) || [];

      const attendanceDates = new Set(records.map((record) => record.date));

      let present = 0;
      let late = 0;
      let checkedOut = 0;
      let totalWorkingHours = 0;

      records.forEach((record) => {
        if (record.status === "present") {
          present++;
        }

        if (record.status === "late") {
          late++;
        }

        if (record.checkOut) {
          checkedOut++;
        }

        if (record.checkIn && record.checkOut) {
          const milliseconds =
            new Date(record.checkOut).getTime() -
            new Date(record.checkIn).getTime();

          const hours = milliseconds / (1000 * 60 * 60);

          if (hours > 0) {
            totalWorkingHours += hours;
          }
        }
      });

      // ==========================================
      // REAL ABSENT CALCULATION
      // ==========================================

      const absent = workingDates.filter(
        (workingDate) => !attendanceDates.has(workingDate),
      ).length;

      return {
        employee: {
          id: employee._id,
          name: employee.name,
          email: employee.email,
          phone: employee.phone,
        },

        summary: {
          workingDays,
          present,
          late,
          absent,
          checkedOut,
          totalWorkingHours: Number(totalWorkingHours.toFixed(2)),
        },
      };
    });

    // ==========================================
    // GLOBAL SUMMARY
    // ==========================================

    const totalPresent = attendanceRecords.filter(
      (record) => record.status === "present",
    ).length;

    const totalLate = attendanceRecords.filter(
      (record) => record.status === "late",
    ).length;

    const totalCheckedOut = attendanceRecords.filter(
      (record) => !!record.checkOut,
    ).length;

    const totalAbsent = employeeReports.reduce(
      (total, employee) => total + employee.summary.absent,
      0,
    );

    // ==========================================
    // TOTAL WORKING HOURS
    // ==========================================

    let totalWorkingHours = 0;

    attendanceRecords.forEach((record) => {
      if (record.checkIn && record.checkOut) {
        const milliseconds =
          new Date(record.checkOut).getTime() -
          new Date(record.checkIn).getTime();

        totalWorkingHours += milliseconds / (1000 * 60 * 60);
      }
    });

    // ==========================================
    // TOTAL CALENDAR DAYS
    // ==========================================

    const start = new Date(`${startDate}T00:00:00+05:30`);

    const end = new Date(`${endDate}T00:00:00+05:30`);

    const totalDays =
      Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;

    // ==========================================
    // RESPONSE
    // ==========================================

    return res.status(200).json({
      success: true,

      period: {
        startDate,
        endDate,
        totalDays,
        workingDays,
      },

      settings: {
        weeklyOffDays,
        holidays,
      },

      summary: {
        totalEmployees: employees.length,

        workingDays,

        present: totalPresent,

        late: totalLate,

        absent: totalAbsent,

        checkedOut: totalCheckedOut,

        totalWorkingHours: Number(totalWorkingHours.toFixed(2)),
      },

      employeeReports,

      attendance: attendanceRecords,
    });
  } catch (error) {
    console.error("Get Admin Attendance Report Error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

module.exports = {
  checkIn,
  checkOut,
  getMyAttendance,
  getMyTodayAttendance,
  getAdminDashboardStats,
  getAdminTodayAttendance,
  getAdminAttendance,
  getAdminAttendanceReport,
};
