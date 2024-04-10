const express = require('express');
const FlightController = require('../controllers/flight');
const {
  isCognitoAuthOpt,
  isCognitoAuthAdmin,
} = require('../middleware/is-auth');

const router = express.Router();

// Search flights
router.get('/flights', isCognitoAuthOpt, FlightController.searchFlights);

// Add new flight (Admin permission needed)
router.post('/new', isCognitoAuthAdmin, FlightController.addFlight);

// Update price of a scheduled flight (Admin permission needed)
router.put(
  '/:flightId/price',
  isCognitoAuthAdmin,
  FlightController.updatePrice,
);

// Update status of a flight (Admin permission needed)
router.put(
  '/:flightId/status',
  isCognitoAuthAdmin,
  FlightController.updateStatus,
);

module.exports = router;
