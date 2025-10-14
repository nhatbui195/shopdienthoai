const serverless = require('serverless-http');
const app = require('../index'); // chính là express() ở trên
module.exports = serverless(app);
