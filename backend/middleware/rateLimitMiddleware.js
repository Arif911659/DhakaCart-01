// backend/middleware/rateLimitMiddleware.js

const rateLimit = new Map();

exports.rateLimiter = (options = {}) => {
  const {
    windowMs = 15 * 60 * 1000, // 15 minutes
    max = 100, // max requests per window
    message = 'Too many requests, please try again later'
  } = options;

  return (req, res, next) => {
    const key = req.ip || req.connection.remoteAddress;
    const now = Date.now();
    
    if (!rateLimit.has(key)) {
      rateLimit.set(key, { count: 1, resetTime: now + windowMs });
      return next();
    }

    const userData = rateLimit.get(key);

    if (now > userData.resetTime) {
      userData.count = 1;
      userData.resetTime = now + windowMs;
      return next();
    }

    if (userData.count >= max) {
      return res.status(429).json({ 
        error: message,
        retryAfter: Math.ceil((userData.resetTime - now) / 1000)
      });
    }

    userData.count++;
    next();
  };
};

// Cleanup old entries every hour
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of rateLimit.entries()) {
    if (now > value.resetTime) {
      rateLimit.delete(key);
    }
  }
}, 60 * 60 * 1000);
