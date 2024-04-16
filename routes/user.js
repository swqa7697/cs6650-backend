const express = require('express');
const UserController = require('../controllers/user');
const { isCognitoAuth } = require('../middleware/is-auth');

const router = express.Router();

// Retrieve booking history
router.get('/reservations', isCognitoAuth, UserController.getReservations);

// Reserve a flight
router.post('/book', isCognitoAuth, UserController.bookFlight);

module.exports = router;
