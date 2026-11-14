const jwt = require("jsonwebtoken");
const AppError = require("../utils/AppError");
const getJwtSecret = require("../utils/jwtSecret");
const ROLES = require("../utils/roles");

const authenticate = (req, res, next) => {
  const authorization = req.get("authorization") || "";
  const match = authorization.match(/^Bearer\s+(.+)$/i);
  if (!match) return next(new AppError("Authentication required", 401));

  let secret;
  try {
    secret = getJwtSecret();
  } catch (error) {
    return next(error);
  }

  let claims;
  try {
    claims = jwt.verify(match[1], secret, { algorithms: ["HS256"] });
  } catch (error) {
    if (
      error.name === "JsonWebTokenError" ||
      error.name === "TokenExpiredError" ||
      error.name === "NotBeforeError"
    ) {
      return next(new AppError("Invalid or expired authentication token", 401));
    }
    return next(error);
  }

  if (
    !claims ||
    typeof claims !== "object" ||
    typeof claims.sub !== "string" ||
    !claims.sub.trim() ||
    typeof claims.exp !== "number" ||
    !ROLES.includes(claims.role) ||
    (claims.role === "INTERVIEWER" &&
      (typeof claims.interviewerId !== "string" || !claims.interviewerId.trim()))
  ) {
    return next(new AppError("Token is missing valid actor claims", 401));
  }

  req.user = {
    id: claims.sub,
    role: claims.role,
    ...(claims.interviewerId ? { interviewerId: claims.interviewerId } : {}),
  };
  next();
};

const authorize = (...roles) => (req, res, next) => {
  if (!req.user) return next(new AppError("Authentication required", 401));
  if (!roles.includes(req.user.role)) {
    return next(new AppError("Insufficient permissions", 403));
  }
  next();
};

module.exports = { authenticate, authorize, ROLES };
