const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");

const connectDB = require("./config/db");

const authRoutes = require("./routes/authRoutes");
const schoolRoutes = require("./routes/schoolRoutes");
const locationRoutes = require("./routes/locationRoutes");
const attendanceRoutes = require("./routes/attendanceRoutes");



dotenv.config();
const app = express();

// Database
connectDB();

// Middleware
app.use(cors());
app.use(express.json());




app.use("/api/auth", authRoutes);
app.use("/api/school", schoolRoutes);
app.use("/api/location", locationRoutes);
app.use("/api/attendance",attendanceRoutes);

app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "School Attendance API is running",
  });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});