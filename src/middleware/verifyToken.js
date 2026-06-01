const jwt = require('jsonwebtoken');
const Manager = require('../models/manager');
// const redis = require('../config/redis');


const verifyToken = async (req, res, next) => {
  try {
    const authHeader = req.headers["authorization"];

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "No token provided or invalid format" });
    }

    const token = authHeader.split(" ")[1];

    // Verify token using a Promise wrapper to make it clean and modern
    const decoded = await new Promise((resolve, reject) => {
      jwt.verify(token, process.env.JWT_SECRET, (err, decodedPayload) => {
        if (err) reject(err);
        else resolve(decodedPayload);
      });
    });

    console.log(`[verifyToken] Token decoded successfully:`, decoded);

    if (decoded.role === "manager") {
      const manager = await Manager.findOne({
        $or: [
          { managerId: decoded.managerId },
          { mobileNumber: decoded.mobile }
        ]
      });

      console.log(`[verifyToken] Manager database lookup result:`, manager);

      if (!manager || manager.isBlocked === true || manager.isBlocked === "true") {
        console.log(`[verifyToken] Access denied: Manager ${decoded.managerId || decoded.mobile} is blocked or not found.`);
        return res.status(403).json({ 
          message: "Aapka account block kar diya gaya hai. Kripya owner se sampark karein." 
        });
      }
    }

    // Driver role - no extra DB check needed, token itself is the auth
    if (decoded.role === "driver") {
      console.log(`[verifyToken] Driver token verified: driverId=${decoded.driverId}, mobile=${decoded.mobile}`);
    }

    req.user = decoded;
    next();
  } catch (error) {
    console.error("[verifyToken] Error verifying token:", error);
    return res.status(403).json({ message: "Invalid or expired token" });
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