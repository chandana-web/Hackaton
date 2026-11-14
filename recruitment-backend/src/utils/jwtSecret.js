const AppError = require("./AppError");

module.exports = () => {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.length < 32 || secret.startsWith("replace-with-")) {
    throw new AppError("Set JWT_SECRET to a private random value of at least 32 characters", 500);
  }
  return secret;
};
