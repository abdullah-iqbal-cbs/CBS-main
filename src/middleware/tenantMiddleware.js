// tenantMiddleware.js  
module.exports = (req, res, next) => {  
  const tenant = req.headers['tenantId']; // Extract tenant ID from request headers  

  if (!tenant) {  
    return res.status(400).json({ error: 'Tenant ID is required' });  
  }  

  req.tenant = tenant; // Attach tenant to request object  
  next();  
};
