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

    // =========================
    // Weekly Off
    // 0 = Sunday
    // 1 = Monday
    // 2 = Tuesday
    // 3 = Wednesday
    // 4 = Thursday
    // 5 = Friday
    // 6 = Saturday
    // =========================

    weeklyOffDays: {
      type: [Number],
      default: [0],
      validate: {
        validator: function (days) {
          return days.every(
            (day) =>
              Number.isInteger(day) &&
              day >= 0 &&
              day <= 6
          );
        },
        message:
          "Weekly off days must contain values between 0 and 6",
      },
    },

    // =========================
    // Holidays
    // =========================

    holidays: [
      {
        _id: false,

        date: {
          type: String,
          required: true,
          match: /^\d{4}-\d{2}-\d{2}$/,
        },

        name: {
          type: String,
          required: true,
          trim: true,
        },
      },
    ],

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("School", schoolSchema);