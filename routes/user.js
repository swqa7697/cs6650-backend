const express = require('express');
const UserController = require('../controllers/user');
const { isCognitoAuth } = require('../middleware/is-auth');

const router = express.Router();

// Retrieve booking history
router.get('/reservations', UserController.getReservations);

// Reserve a flight
router.post('/book', UserController.bookFlight);

module.exports = router;
