require("dotenv").config();

const express = require("express");
const cors = require("cors");

const connectDatabase = require("./src/config/db");
const authRoutes = require("./src/routes/authRoutes");
const userRoutes = require("./src/routes/userRoutes");
const teamRoutes = require("./src/routes/teamRoutes");
const customerRoutes = require("./src/routes/customerRoutes");
const applicationRoutes = require("./src/routes/applicationRoutes");
const workflowRoutes = require("./src/routes/workflowRoutes");
const workItemRoutes = require("./src/routes/workItemRoutes");
const mockExternalRoutes = require("./src/routes/mockExternalRoutes");
const {startSyncWorker,} = require("./src/jobs/syncWorker");
const syncRoutes = require("./src/routes/syncRoutes");
const activityRoutes = require("./src/routes/activityRoutes");
const assignmentRoutes = require("./src/routes/assignmentRoutes");

const app = express();

const PORT = process.env.PORT || 5000;

// Middleware
app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:3000",
    credentials: true,
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check
app.get("/api/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Application Management API is running",
    timestamp: new Date().toISOString(),
  });
});

// API routes
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/teams", teamRoutes);
app.use("/api/customers", customerRoutes);
app.use("/api/applications", applicationRoutes);
app.use("/api", workflowRoutes);
app.use("/api/work-items", workItemRoutes);
app.use("/api/mock-external", mockExternalRoutes);
app.use("/api", syncRoutes);
app.use("/api", activityRoutes);
app.use("/api", assignmentRoutes);
// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
  });
});

// Global error handler
app.use((error, req, res, next) => {
  console.error("Unhandled error:", error);

  res.status(500).json({
    success: false,
    message: "Internal server error",
  });
});

// Start server
const startServer = async () => {
  await connectDatabase();

  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);

    startSyncWorker();

  });
};

startServer();