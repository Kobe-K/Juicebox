const jwt = require('jsonwebtoken');

function requireUser(req, res, next) {
  try {
    
    const token = req.headers.authorization.split(' ')[1]
    
    if (!token) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    const decodedToken = jwt.verify(token, process.env.JWT_SECRET)
    
    req.userId = decodedToken.id
    req.username = decodedToken.username
    
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Unauthorized' })
  }
}

module.exports = {
  requireUser
}