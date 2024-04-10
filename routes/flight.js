const express = require('express');
const FlightController = require('../controllers/flight');

const router = express.Router();

// Search flights
router.get('/flights', FlightController.searchFlights);

// Add new flight (by an admin, or for test)
// Should not called by the customer client
router.post('/new', FlightController.addFlight);

// Update price of a scheduled flight
router.put('/:flightId/price', FlightController.updatePrice);

module.exports = router;
