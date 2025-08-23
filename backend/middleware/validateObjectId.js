import mongoose from 'mongoose';

export default function validateObjectIdParam(paramName = 'id') {
  return (req, res, next) => {
    const value = req.params[paramName];
    if (!mongoose.Types.ObjectId.isValid(value)) {
      return res.status(400).json({ error: `Invalid ${paramName}` });
    }
    next();
  };
}
