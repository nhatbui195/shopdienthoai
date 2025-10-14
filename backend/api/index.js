// backend/api/index.js
const serverless = require('serverless-http');
const app = require('../index');

module.exports = (req, res) => {
  // có thể set header chung ở đây nếu cần
  const handler = serverless(app);
  return handler(req, res);
};
