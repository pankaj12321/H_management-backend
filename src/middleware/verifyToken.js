const jwt = require('jsonwebtoken');
const redis = require('../config/redis');

const verifyTokenHandle = async (req, res, next) => {
    const authTokenHeader = req.headers.Authorization || req.headers.authorization;
  
    if (!authTokenHeader) {
      const error = new Error('Unauthorized, Token Required!');
      error.statusCode = 401; 
      return next(error); 
    }
  
    if (authTokenHeader && authTokenHeader.startsWith('Bearer ')) {
      let token = authTokenHeader.split('Bearer ')[1]
      if (token) {
        return jwt.verify(token, process.env.TOKEN_SECRET_KEY, function (err, decoded) {
          if (err) {
            const error = new Error('Failed to authenticate token, Invalid token');
            error.statusCode = 401; 
            return next(error); 
          }
  
          req.user = decoded; 
          return next(); 
  
        });
      }
    } else {
      const error = new Error('Token format is invalid. Must be \'Bearer [token]\'');
      error.statusCode = 401; 
      return next(error); 
    }
  };

  const deleteToken = async (req) => {
    try {
      const reqToken = req.headers.authorization?.split('Bearer ')[1];
      if (!reqToken) return true;
  
      const decoded = req.user;
      if (!decoded?.userId || !decoded?.role) return true;
  
      const redisKey = `SESSION_${decoded.userId}_${reqToken}`;
      await redis.del(redisKey); 
  
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
    verifyTokenHandle,
    deleteToken
}