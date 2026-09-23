const School = require("../models/School");
const calculateDistance = require("../utils/distance");

// ======================================
// CHECK EMPLOYEE LOCATION
// ======================================
const checkLocation = async (req, res) => {
  try {
    const { latitude, longitude } = req.body;

    // Validate coordinates
    if (
      latitude === undefined ||
      longitude === undefined
    ) {
      return res.status(400).json({
        success: false,
        message: "Latitude and longitude are required",
      });
    }

    // Convert to numbers
    const employeeLatitude = Number(latitude);
    const employeeLongitude = Number(longitude);

    // Validate number
    if (
      !Number.isFinite(employeeLatitude) ||
      !Number.isFinite(employeeLongitude)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid latitude or longitude",
      });
    }

    // Validate GPS ranges
    if (
      employeeLatitude < -90 ||
      employeeLatitude > 90 ||
      employeeLongitude < -180 ||
      employeeLongitude > 180
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid GPS coordinates",
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

    // Calculate distance
    const distance = calculateDistance(
      employeeLatitude,
      employeeLongitude,
      school.latitude,
      school.longitude
    );

    const isInsideSchool =
      distance <= school.radius;

    res.status(200).json({
      success: true,
      location: {
        latitude: employeeLatitude,
        longitude: employeeLongitude,
      },
      school: {
        name: school.name,
        latitude: school.latitude,
        longitude: school.longitude,
        radius: school.radius,
      },
      distance: Math.round(distance),
      unit: "meters",
      isInsideSchool,
      message: isInsideSchool
        ? "You are inside the school area"
        : "You are outside the school area",
    });
  } catch (error) {
    console.error("Location Check Error:", error);

    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

module.exports = {
  checkLocation,
};