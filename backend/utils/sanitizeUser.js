/**
 * Utility to sanitize user objects before serializing to API responses.
 * Removes sensitive fields like password hashes, reset tokens, and internal metadata.
 */
const sanitizeUser = (user) => {
  if (!user) return null;

  // Convert Mongoose document to plain object if applicable
  const userObj = typeof user.toObject === 'function' ? user.toObject() : { ...user };

  delete userObj.password;
  delete userObj.resetPasswordToken;
  delete userObj.resetPasswordExpire;
  delete userObj.__v;

  return userObj;
};

module.exports = { sanitizeUser };
