const School = require("../models/School");

// ==========================================
// CREATE SCHOOL
// ==========================================
const createSchool = async (req, res) => {
  try {
    const {
      name,
      latitude,
      longitude,
      radius,
      gpsAccuracyLimit,
    } = req.body;

    if (
      !name ||
      latitude === undefined ||
      longitude === undefined
    ) {
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
      radius:
        radius !== undefined
          ? Number(radius)
          : 150,
      gpsAccuracyLimit:
        gpsAccuracyLimit !== undefined
          ? Number(gpsAccuracyLimit)
          : 50,
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

    // Validate coordinates if provided
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

    // Update name
    if (name !== undefined) {
      if (!name.trim()) {
        return res.status(400).json({
          success: false,
          message: "School name cannot be empty",
        });
      }

      school.name = name.trim();
    }

    // Update radius
    if (radius !== undefined) {
      const parsedRadius = Number(radius);

      if (
        !Number.isFinite(parsedRadius) ||
        parsedRadius < 20
      ) {
        return res.status(400).json({
          success: false,
          message: "Radius must be at least 20 meters",
        });
      }

      school.radius = parsedRadius;
    }

    // Update GPS accuracy limit
    if (gpsAccuracyLimit !== undefined) {
      const parsedAccuracyLimit =
        Number(gpsAccuracyLimit);

      if (
        !Number.isFinite(parsedAccuracyLimit) ||
        parsedAccuracyLimit < 10 ||
        parsedAccuracyLimit > 500
      ) {
        return res.status(400).json({
          success: false,
          message:
            "GPS accuracy limit must be between 10 and 500 meters",
        });
      }

      school.gpsAccuracyLimit =
        parsedAccuracyLimit;
    }

    await school.save();

    res.status(200).json({
      success: true,
      message: "School location updated successfully",
      school,
    });
  } catch (error) {
    console.error("Update School Error:", error);

    res.status(500).json({
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