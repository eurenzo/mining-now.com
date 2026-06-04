export const requestSizeLimiter = (req, res, next) => {
  const contentLength = req.headers['content-length'];
  const MAX_BODY_SIZE = 10 * 1024 * 1024;

  if (contentLength && parseInt(contentLength) > MAX_BODY_SIZE) {
    return res.status(413).json({
      success: false,
      message: 'Request body too large'
    });
  }
  next();
};
