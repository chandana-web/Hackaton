require("dotenv").config();

const connectDB = require("./src/config/db");
const app = require("./src/app");

const startServer = async () => {
  await connectDB();

  const port = process.env.PORT || 5000;
  const server = app.listen(port, () => {
    console.log(`Server running on port ${port}`);
  });

  return server;
};

if (require.main === module) {
  startServer().catch((error) => {
    console.error("Server startup failed:", error.message);
    process.exitCode = 1;
  });
}

module.exports = { app, startServer };
