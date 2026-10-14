
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema(
  {
    // Basic details
    name: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    phone: {
      type: String,
      required: true,
      trim: true,
    },

    password: {
      type: String,
      required: true,
      minlength: 6,
      select: false,
    },

    role: {
      type: String,
      enum: ["admin", "employee"],
      default: "employee",
    },

    // Personal details
    dateOfBirth: {
      type: Date,
      default: null,
    },

    currentAddress: {
      type: String,
      trim: true,
      default: "",
    },

    permanentAddress: {
      type: String,
      trim: true,
      default: "",
    },

    // Professional details
    qualification: {
      type: String,
      trim: true,
      default: "",
    },

    specialization: {
      type: String,
      trim: true,
      default: "",
    },

    designation: {
      type: String,
      trim: true,
      default: "",
    },

    isClassTeacher: {
      type: Boolean,
      default: false,
    },

    classTeacherClass: {
      type: String,
      trim: true,
      default: "",
    },

    classTeacherSection: {
      type: String,
      trim: true,
      default: "",
    },

    subjects: {
      type: [String],
      default: [],
    },

    // Bank and UPI details
    bankDetails: {
      accountHolderName: {
        type: String,
        trim: true,
        default: "",
      },

      bankName: {
        type: String,
        trim: true,
        default: "",
      },

      accountNumber: {
        type: String,
        trim: true,
        default: "",
        select: false,
      },

      ifscCode: {
        type: String,
        trim: true,
        uppercase: true,
        default: "",
        select: false,
      },

      upiId: {
        type: String,
        trim: true,
        default: "",
        select: false,
      },
    },

    // Existing face recognition fields — preserved
    faceData: {
      type: [Number],
      default: null,
    },

    faceSamples: {
      type: [[Number]],
      default: [],
    },

    // Existing account status — preserved
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  },
);

// Password hashing
userSchema.pre("save", async function () {
  if (!this.isModified("password")) {
    return;
  }

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Password comparison
userSchema.methods.comparePassword = async function (enteredPassword) {
  return bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model("User", userSchema);
