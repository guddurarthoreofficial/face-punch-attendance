const mongoose = require("mongoose");

const schoolSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    latitude: {
      type: Number,
      required: true,
    },

    longitude: {
      type: Number,
      required: true,
    },

    radius: {
      type: Number,
      default: 150,
      min: 20,
    },

    gpsAccuracyLimit: {
      type: Number,
      default: 50,
      min: 10,
      max: 500,
    },

    attendanceRules: {
      checkInTime: {
        type: String,
        default: "09:00",
      },

      lateAfterMinutes: {
        type: Number,
        default: 15,
        min: 0,
        max: 180,
      },

      minimumWorkingHours: {
        type: Number,
        default: 8,
        min: 1,
        max: 24,
      },

      allowEarlyCheckout: {
        type: Boolean,
        default: false,
      },
    },

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports =
  mongoose.model("School", schoolSchema);