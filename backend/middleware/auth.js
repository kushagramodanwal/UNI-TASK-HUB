import { verifyToken } from '@clerk/clerk-sdk-node';


export const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader?.split(' ')[1];

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access token required'
      });
    }

    const payload = await verifyToken(token, {
      secretKey: process.env.CLERK_SECRET_KEY
    });

    req.user = {
      id: payload.sub,
      email: payload.email,
      firstName: payload.first_name,
      lastName: payload.last_name,
      fullName: `${payload.first_name || ''} ${payload.last_name || ''}`.trim(),
      imageUrl: payload.image_url
    };

    next();
  } catch (error) {
    console.error('Token verification error:', error);
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired token'
    });
  }
};

export const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader?.split(' ')[1];

    if (token) {
      const payload = await verifyToken(token, {
        secretKey: process.env.CLERK_SECRET_KEY
      });

      req.user = {
        id: payload.sub,
        email: payload.email,
        firstName: payload.first_name,
        lastName: payload.last_name,
        fullName: `${payload.first_name || ''} ${payload.last_name || ''}`.trim(),
        imageUrl: payload.image_url
      };
    }

    next();
  } catch {
    next();
  }
};

export const checkOwnership = (resourceModel) => {
  return async (req, res, next) => {
    try {
      const resourceId = req.params.id;
      const userId = req.user?.id;

      const resource = await resourceModel.findById(resourceId);
      if (!resource) {
        return res.status(404).json({
          success: false,
          message: 'Resource not found'
        });
      }

      if (resource.userId !== userId) {
        return res.status(403).json({
          success: false,
          message: 'Access denied. You can only modify your own resources.'
        });
      }

      req.resource = resource;
      next();
    } catch (error) {
      console.error('Ownership check error:', error);
      return res.status(500).json({
        success: false,
        message: 'Error checking resource ownership'
      });
    }
  };
};
