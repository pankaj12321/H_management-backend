const jwt = require('jsonwebtoken');
const Manager = require('../models/manager');
// const redis = require('../config/redis');


const verifyToken = (req, res, next) => {
  try {
    const authHeader = req.headers["authorization"];

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "No token provided or invalid format" });
    }

    const token = authHeader.split(" ")[1];

    jwt.verify(token, process.env.JWT_SECRET, async (err, decoded) => {
      if (err) {
        return res.status(403).json({ message: "Invalid or expired token" });
      }

      if (decoded.role === "manager") {
        try {
          const manager = await Manager.findOne({ managerId: decoded.managerId });
          if (!manager || manager.isBlocked) {
            return res.status(403).json({ message: "Aapka account block kar diya gaya hai. Kripya owner se sampark karein." });
          }
        } catch (dbErr) {
          console.error("Error checking manager block status:", dbErr);
          return res.status(500).json({ message: "Internal Server Error" });
        }
      }

      req.user = decoded;
      next();
    });
  } catch (error) {
    console.error("Error verifying token:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};



const deleteToken = async (req) => {
  try {
    const reqToken = req.headers.authorization?.split('Bearer ')[1];
    if (!reqToken) return true;

    const decoded = req.user;
    if (!decoded?.userId || !decoded?.role) return true;

    // const redisKey = `SESSION_${decoded.userId}_${reqToken}`;
    // await redis.del(redisKey); 

    if (decoded.role === 'buyer') {
      await User.updateOne({ userId: decoded.userId }, { $unset: { token: "" } });
    } else if (decoded.role === 'seller') {
      await Seller.updateOne({ userId: decoded.userId }, { $unset: { token: "" } });
    }

    return true;
  } catch (error) {
    throw error;
  }
};
module.exports = {
  verifyToken,
  deleteToken
}