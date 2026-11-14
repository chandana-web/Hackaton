const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const Interviewer = require("../models/Interviewer");
const AppError = require("../utils/AppError");
const getJwtSecret = require("../utils/jwtSecret");

const publicUser = (user) => ({
  id: user._id.toString(),
  name: user.name,
  email: user.email,
  role: user.role,
  ...(user.interviewerId ? { interviewerId: user.interviewerId } : {}),
});

const assertPasswordLength = (password) => {
  if (Buffer.byteLength(password, "utf8") > 72) {
    throw new AppError("Password must be no more than 72 bytes", 400);
  }
};

const issueToken = (user) => {
  return jwt.sign(
    { role: user.role, ...(user.interviewerId ? { interviewerId: user.interviewerId } : {}) },
    getJwtSecret(),
    { algorithm: "HS256", subject: user._id.toString(), expiresIn: "8h" }
  );
};

const createBootstrapAdmin = async ({ name, email, password, setupKey }) => {
  getJwtSecret();

  const expectedKey = process.env.BOOTSTRAP_ADMIN_SETUP_KEY || "";
  const providedBuffer = Buffer.from(setupKey);
  const expectedBuffer = Buffer.from(expectedKey);

  if (expectedBuffer.length < 32) {
    throw new AppError("First-admin setup is not configured", 503);
  }
  if (
    providedBuffer.length !== expectedBuffer.length ||
    !crypto.timingSafeEqual(providedBuffer, expectedBuffer)
  ) {
    throw new AppError("Invalid setup key", 403);
  }
  if (await User.countDocuments({}) > 0) {
    throw new AppError("Initial administrator setup is already complete", 409);
  }

  assertPasswordLength(password);
  const user = await User.create({
    name,
    email,
    passwordHash: await bcrypt.hash(password, 12),
    role: "SYSTEM_ADMIN",
    isBootstrapAdmin: true,
  });

  return { user: publicUser(user), token: issueToken(user) };
};

const login = async ({ email, password }) => {
  const user = await User.findOne({ email: email.toLowerCase(), isActive: true })
    .select("+passwordHash");
  if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
    throw new AppError("Invalid email or password", 401);
  }

  return { user: publicUser(user), token: issueToken(user) };
};

const getCurrentUser = async (id) => {
  const user = await User.findOne({ _id: id, isActive: true });
  if (!user) throw new AppError("User account is inactive or no longer exists", 401);
  return publicUser(user);
};

const listUsers = async () => {
  const users = await User.find({}).sort({ createdAt: -1 });
  return users.map(publicUser);
};

const createUser = async ({ name, email, password, role, interviewerId }) => {
  assertPasswordLength(password);
  if (role === "INTERVIEWER") {
    const interviewer = await Interviewer.findOne({
      interviewerId,
      isActive: true,
    });
    if (!interviewer) {
      throw new AppError("Select an active interviewer profile", 400);
    }
  }
  try {
    const user = await User.create({
      name,
      email,
      passwordHash: await bcrypt.hash(password, 12),
      role,
      ...(role === "INTERVIEWER" ? { interviewerId } : {}),
    });
    return publicUser(user);
  } catch (error) {
    if (error.code === 11000) {
      throw new AppError("A user with this email or interviewer profile already exists", 409);
    }
    throw error;
  }
};

module.exports = { createBootstrapAdmin, login, getCurrentUser, listUsers, createUser };
