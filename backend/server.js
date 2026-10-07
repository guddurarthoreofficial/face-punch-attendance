const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
dotenv.config();

const connectDB = require("./config/db");

const authRoutes = require("./routes/authRoutes");
const schoolRoutes = require("./routes/schoolRoutes");
const locationRoutes = require("./routes/locationRoutes");
const attendanceRoutes = require("./routes/attendanceRoutes");
const employeeRoutes = require("./routes/employeeRoutes");
const pushRoutes = require("./routes/pushRoutes");

dotenv.config();

const app = express();

// ==========================================
// CORS
// ==========================================

const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:5174",
  "https://attendance-beta-five.vercel.app",
];

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests without an Origin
      // (Postman, server-to-server, etc.)
      if (!origin) {
        return callback(null, true);
      }

      // Allow local development
      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      // Allow deployed frontend
      if (origin.includes(".vercel.app")) {
        return callback(null, true);
      }

      return callback(new Error("Not allowed by CORS"));
    },

    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],

    allowedHeaders: ["Content-Type", "Authorization"],

    credentials: true,
  }),
);

// ==========================================
// BODY PARSER
// ==========================================

app.use(express.json());

// ==========================================
// DATABASE
// ==========================================

connectDB();

// ==========================================
// REQUEST LOGGER
// ==========================================

app.use((req, res, next) => {
  console.log(
    `[${new Date().toLocaleString("en-IN")}] ${req.method} ${req.originalUrl}`,
  );

  next();
});

// ==========================================
// ROUTES
// ==========================================

app.use("/api/auth", authRoutes);

app.use("/api/school", schoolRoutes);

app.use("/api/location", locationRoutes);

app.use("/api/attendance", attendanceRoutes);

app.use("/api/employees", employeeRoutes);

app.use("/api/push", pushRoutes);

// ==========================================
// ROOT
// ==========================================

app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "School Attendance API is running",
  });
});

// ==========================================
// SERVER
// ==========================================

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
