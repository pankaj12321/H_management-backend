const jwt = require("jsonwebtoken");

const createTokenHandler = (user) => {
  const payload = {
    _id: user._id,
    email: user.email,
    firstName:user.firstName,
    role: user.role,
    userId: user.userId,
    teacherId: user.teacherId,
    mobile: user.mobile
  };
  return jwt.sign(payload, process.env.TOKEN_SECRET_KEY, {
    expiresIn: "1d"
  });
};

module.exports = {
  createTokenHandler,
};
