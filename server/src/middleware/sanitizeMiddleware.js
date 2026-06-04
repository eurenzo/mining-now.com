import xss from 'xss';

export const sanitizeInputs = (req, res, next) => {
  if (req.body && typeof req.body === 'object') {
    for (const [key, value] of Object.entries(req.body)) {
      if (typeof value === 'string') {
        req.body[key] = xss(value);
      }
    }
  }
  next();
};
