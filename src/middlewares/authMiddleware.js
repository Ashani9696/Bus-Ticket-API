const jwt = require("jsonwebtoken");
const User = require("../models/userModel");

const protect = async (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];

  if (!token)
    return res.status(401).json({ message: "Not authorized, no token" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(decoded.id).select("-password");
    next();
  } catch (error) {
    return res.status(403).json({ message: "Invalid or expired token" });
  }
};

const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user.role.some((role) => roles.includes(role))) {
      return res.status(403).json({ message: "Access denied" });
    }
    next();
  };
};

module.exports = { protect, authorize };
