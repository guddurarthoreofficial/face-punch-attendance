const School = require("../models/School");

// ==========================================
// CREATE SCHOOL
// ==========================================
const createSchool = async (req, res) => {
  try {
    const { name, latitude, longitude, radius, gpsAccuracyLimit } = req.body;

    if (!name || latitude === undefined || longitude === undefined) {
      return res.status(400).json({
        success: false,
        message: "Name, latitude and longitude are required",
      });
    }

    const existingSchool = await School.findOne({
      isActive: true,
    });

    if (existingSchool) {
      return res.status(409).json({
        success: false,
        message: "Active school already exists",
      });
    }

    const school = await School.create({
      name,
      latitude: Number(latitude),
      longitude: Number(longitude),
      radius: radius !== undefined ? Number(radius) : 150,
      gpsAccuracyLimit:
        gpsAccuracyLimit !== undefined ? Number(gpsAccuracyLimit) : 50,
    });

    res.status(201).json({
      success: true,
      message: "School location created successfully",
      school,
    });
  } catch (error) {
    console.error("Create School Error:", error);

    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// ==========================================
// GET ACTIVE SCHOOL
// ==========================================
const getSchool = async (req, res) => {
  try {
    const school = await School.findOne({
      isActive: true,
    });

    if (!school) {
      return res.status(404).json({
        success: false,
        message: "School location not configured",
      });
    }

    res.status(200).json({
      success: true,
      school,
    });
  } catch (error) {
    console.error("Get School Error:", error);

    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// ==========================================
// UPDATE SCHOOL LOCATION
// ==========================================
const updateSchool = async (req, res) => {
  try {
    const {
      name,
      latitude,
      longitude,
      radius,
      gpsAccuracyLimit,
      attendanceRules,
      weeklyOffDays,
      holidays,
    } = req.body;

    const school = await School.findOne({
      isActive: true,
    });

    if (!school) {
      return res.status(404).json({
        success: false,
        message: "School location not configured",
      });
    }

    // ==========================================
    // SCHOOL NAME
    // ==========================================

    if (name !== undefined) {
      if (typeof name !== "string" || !name.trim()) {
        return res.status(400).json({
          success: false,
          message: "School name cannot be empty",
        });
      }

      school.name = name.trim();
    }

    // ==========================================
    // LATITUDE
    // ==========================================

    if (latitude !== undefined) {
      const parsedLatitude = Number(latitude);

      if (
        !Number.isFinite(parsedLatitude) ||
        parsedLatitude < -90 ||
        parsedLatitude > 90
      ) {
        return res.status(400).json({
          success: false,
          message: "Invalid latitude",
        });
      }

      school.latitude = parsedLatitude;
    }

    // ==========================================
    // LONGITUDE
    // ==========================================

    if (longitude !== undefined) {
      const parsedLongitude = Number(longitude);

      if (
        !Number.isFinite(parsedLongitude) ||
        parsedLongitude < -180 ||
        parsedLongitude > 180
      ) {
        return res.status(400).json({
          success: false,
          message: "Invalid longitude",
        });
      }

      school.longitude = parsedLongitude;
    }

    // ==========================================
    // RADIUS
    // ==========================================

    if (radius !== undefined) {
      const parsedRadius = Number(radius);

      if (!Number.isFinite(parsedRadius) || parsedRadius < 20) {
        return res.status(400).json({
          success: false,
          message: "Radius must be at least 20 meters",
        });
      }

      school.radius = parsedRadius;
    }

    // ==========================================
    // GPS ACCURACY LIMIT
    // ==========================================

    if (gpsAccuracyLimit !== undefined) {
      const parsedAccuracyLimit = Number(gpsAccuracyLimit);

      if (
        !Number.isFinite(parsedAccuracyLimit) ||
        parsedAccuracyLimit < 10 ||
        parsedAccuracyLimit > 500
      ) {
        return res.status(400).json({
          success: false,
          message: "GPS accuracy limit must be between 10 and 500 meters",
        });
      }

      school.gpsAccuracyLimit = parsedAccuracyLimit;
    }

    // ==========================================
    // ATTENDANCE RULES
    // ==========================================

    if (attendanceRules !== undefined) {
      if (
        typeof attendanceRules !== "object" ||
        attendanceRules === null ||
        Array.isArray(attendanceRules)
      ) {
        return res.status(400).json({
          success: false,
          message: "Invalid attendance rules",
        });
      }

      // Make sure attendanceRules exists
      if (!school.attendanceRules) {
        school.attendanceRules = {
          checkInTime: "09:00",
          lateAfterMinutes: 15,
          minimumWorkingHours: 8,
          allowEarlyCheckout: false,
        };
      }

      // Check-in time
      if (attendanceRules.checkInTime !== undefined) {
        const checkInTime = attendanceRules.checkInTime;

        if (
          typeof checkInTime !== "string" ||
          !/^(?:[01]\d|2[0-3]):[0-5]\d$/.test(checkInTime)
        ) {
          return res.status(400).json({
            success: false,
            message: "Invalid check-in time. Use HH:mm format.",
          });
        }

        school.attendanceRules.checkInTime = checkInTime;
      }

      // Late threshold
      if (attendanceRules.lateAfterMinutes !== undefined) {
        const lateAfterMinutes = Number(attendanceRules.lateAfterMinutes);

        if (
          !Number.isFinite(lateAfterMinutes) ||
          lateAfterMinutes < 0 ||
          lateAfterMinutes > 180
        ) {
          return res.status(400).json({
            success: false,
            message: "Late threshold must be between 0 and 180 minutes",
          });
        }

        school.attendanceRules.lateAfterMinutes = lateAfterMinutes;
      }

      // Minimum working hours
      if (attendanceRules.minimumWorkingHours !== undefined) {
        const minimumWorkingHours = Number(attendanceRules.minimumWorkingHours);

        if (
          !Number.isFinite(minimumWorkingHours) ||
          minimumWorkingHours < 1 ||
          minimumWorkingHours > 24
        ) {
          return res.status(400).json({
            success: false,
            message: "Minimum working hours must be between 1 and 24",
          });
        }

        school.attendanceRules.minimumWorkingHours = minimumWorkingHours;
      }

      // Allow early checkout
      if (attendanceRules.allowEarlyCheckout !== undefined) {
        if (typeof attendanceRules.allowEarlyCheckout !== "boolean") {
          return res.status(400).json({
            success: false,
            message: "allowEarlyCheckout must be true or false",
          });
        }

        school.attendanceRules.allowEarlyCheckout =
          attendanceRules.allowEarlyCheckout;
      }

      // IMPORTANT:
      // Tell Mongoose that nested rules changed
      school.markModified("attendanceRules");
    }

    // ==========================================
    // SAVE
    // ==========================================

    // ==========================================
    // WEEKLY OFF DAYS
    // ==========================================

    if (weeklyOffDays !== undefined) {
      if (!Array.isArray(weeklyOffDays)) {
        return res.status(400).json({
          success: false,
          message: "weeklyOffDays must be an array",
        });
      }

      const validWeeklyOffDays = weeklyOffDays.every(
        (day) =>
          Number.isInteger(Number(day)) && Number(day) >= 0 && Number(day) <= 6,
      );

      if (!validWeeklyOffDays) {
        return res.status(400).json({
          success: false,
          message: "Weekly off days must contain values between 0 and 6",
        });
      }

      const uniqueWeeklyOffDays = [
        ...new Set(weeklyOffDays.map((day) => Number(day))),
      ];

      school.weeklyOffDays = uniqueWeeklyOffDays;

      school.markModified("weeklyOffDays");
    }

    // ==========================================
    // HOLIDAYS
    // ==========================================

    if (holidays !== undefined) {
      if (!Array.isArray(holidays)) {
        return res.status(400).json({
          success: false,
          message: "holidays must be an array",
        });
      }

      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;

      const validHolidays = holidays.every((holiday) => {
        if (!holiday || typeof holiday !== "object") {
          return false;
        }

        if (typeof holiday.date !== "string" || !dateRegex.test(holiday.date)) {
          return false;
        }

        if (typeof holiday.name !== "string" || !holiday.name.trim()) {
          return false;
        }

        return true;
      });

      if (!validHolidays) {
        return res.status(400).json({
          success: false,
          message: "Each holiday must have a valid date (YYYY-MM-DD) and name",
        });
      }

      // Remove duplicate dates
      const holidayMap = new Map();

      holidays.forEach((holiday) => {
        holidayMap.set(holiday.date, {
          date: holiday.date,
          name: holiday.name.trim(),
        });
      });

      school.holidays = Array.from(holidayMap.values());

      school.markModified("holidays");
    }

    await school.save();

    // ==========================================
    // RE-FETCH FROM DATABASE
    // ==========================================

    const updatedSchool = await School.findById(school._id);

    return res.status(200).json({
      success: true,
      message: "School settings updated successfully",
      school: updatedSchool,
    });
  } catch (error) {
    console.error("Update School Error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

module.exports = {
  createSchool,
  getSchool,
  updateSchool,
};
