const School = require("../models/School");

// Create School
const createSchool = async (req, res) => {
  try {
    const {
      name,
      latitude,
      longitude,
      radius,
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
      latitude,
      longitude,
      radius: radius || 150,
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

// Get Active School
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

module.exports = {
  createSchool,
  getSchool,
};