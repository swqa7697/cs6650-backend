const CognitoExpress = require('cognito-express');
const config = require('../config/config.json');

const cognitoExpress = new CognitoExpress({
  region: config.CognitoRegion,
  cognitoUserPoolId: config.CognitoUserPoolId,
  tokenUse: config.CognitoTokenUse,
  tokenExpiration: config.CognitoTokenExpiration,
});

const isCognitoAuth = (req, res, next) => {
  const token = req.header('cognito-token');
  if (!token) {
    return res.status(401).send('Access Token not found');
  }

  // Authenticate the token
  cognitoExpress.validate(token, (err, response) => {
    if (err) {
      return res.status(401).json({ err });
    }

    // Token has been authenticated. Proceed info to the API
    req.userSub = response.sub;

    next();
  });
};

const isCognitoAuthOpt = (req, res, next) => {
  const token = req.header('cognito-token');

  // No token -> no authentication required
  if (!token) {
    next();
    return;
  }

  // Token exists. Proceed info to the API
  cognitoExpress.validate(token, (err, response) => {
    if (err) {
      return res.status(401).json({ err });
    }

    req.userSub = response.sub;
    next();
  });
};

const isCognitoAuthAdmin = (req, res, next) => {
  const token = req.header('cognito-token');
  if (!token) {
    return res.status(401).send('Access Token not found');
  }

  // Authenticate the token
  cognitoExpress.validate(token, (err, response) => {
    if (err) {
      return res.status(401).json({ err });
    }

    // Check if the user is an authorized administrator
    if (!config.adminUsers.includes(response.sub)) {
      return res.status(401).send('Admin permission required');
    }

    // Token has been authenticated. Proceed info to the API
    req.userSub = response.sub;

    next();
  });
};

module.exports = {
  isCognitoAuth,
  isCognitoAuthOpt,
  isCognitoAuthAdmin,
};
