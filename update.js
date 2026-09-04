const fs = require('fs');

let authCode = fs.readFileSync('middleware/authMiddleware', 'utf8');
authCode = authCode.replace('res.status(401).json({ message: \'Not authorized, token failed\' });', 'return res.status(401).json({ message: \'Not authorized, token failed\' });');
authCode = authCode.replace('res.status(401).json({ message: \'Not authorized, no token provided\' });', 'return res.status(401).json({ message: \'Not authorized, no token provided\' });');
authCode = authCode.replace('res.status(403).json({ message: \'Not authorized as an admin\' });', 'return res.status(403).json({ message: \'Not authorized as an admin\' });');
fs.writeFileSync('middleware/authMiddleware', authCode);

let productCode = fs.readFileSync('controllers/productController.js', 'utf8');
productCode = productCode.replace(
    'const product = await Product.create(req.body);',
    'const productData = { ...req.body };\\n        if (req.file) {\\n            productData.image = req.file.path;\\n        }\\n        const product = await Product.create(productData);'
);
fs.writeFileSync('controllers/productController.js', productCode);
console.log('Update success');
