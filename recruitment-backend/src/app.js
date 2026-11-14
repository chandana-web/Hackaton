const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const path = require("path");

const requisitionRoutes = require("./routes/requisitionRoutes");
const candidateRoutes = require("./routes/candidateRoutes");
const applicationRoutes = require("./routes/applicationRoutes");
const interviewRoutes = require("./routes/interviewRoutes");
const feedbackRoutes = require("./routes/feedbackRoutes");
const offerRoutes = require("./routes/offerRoutes");
const authRoutes = require("./routes/authRoutes");
const interviewerRoutes = require("./routes/interviewerRoutes");
const notFound = require("./middleware/notFound");
const errorHandler = require("./middleware/errorHandler");

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json({ limit: "10kb" }));
app.use(express.urlencoded({ extended: true, limit: "10kb" }));
app.use(morgan("dev"));

app.get("/api/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Recruitment API is running",
    environment: process.env.NODE_ENV,
  });
});

app.get("/api/demo-data", (req, res, next) => {
  const demoEnabled =
    process.env.ENABLE_DEMO_DATA === "true" ||
    (process.env.ENABLE_DEMO_DATA !== "false" &&
      process.env.NODE_ENV !== "production");

  if (!demoEnabled) {
    return res.status(404).json({ success: false, message: "Demo data is disabled" });
  }

  res.sendFile(
    path.join(__dirname, "..", "generated-data", "data.json"),
    (error) => {
      if (error) next(error);
    }
  );
});

app.use("/api/requisitions", requisitionRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/interviewers", interviewerRoutes);
app.use("/api/candidates", candidateRoutes);
app.use("/api/applications", applicationRoutes);
app.use("/api/interviews", interviewRoutes);
app.use("/api/feedback", feedbackRoutes);
app.use("/api/offers", offerRoutes);

app.use(notFound);
app.use(errorHandler);

module.exports = app;
