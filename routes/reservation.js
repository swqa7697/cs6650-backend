const express = require('express');
const ReservationController = require('../controllers/reservation');
const { isCognitoAuth } = require('../middleware/is-auth');

const router = express.Router();

// Confirm an order after purchase
router.put('/confirm', isCognitoAuth, ReservationController.confirmReservation);

// Cancel an order (should only used for automatic cancelation
// triggered by failing to book the combined returning flight)
router.put(
  '/autoCancel',
  isCognitoAuth,
  ReservationController.cancelReservationAuto,
);

module.exports = router;
