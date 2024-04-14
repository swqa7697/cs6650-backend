const axios = require('axios');
const Flight = require('../models/flight');
const config = require('../config/config.json');

/**
 * @api {get} /flight/flights  SearchFlights
 * @apiName SearchFlights
 * @apiGroup Flight
 * @apiDescription ToC use | Search flights by departure, destination and departure date
 *
 * @apiQuery {String} departure     The airport code of the departure
 * @apiQuery {String} destination   The airport code of the destination
 * @apiQuery {String} departureDate Departure date (in UTC time) in the format of mm/dd/yyyy
 *
 * @apiSuccess  {Object[]} Array of flights
 * @apiError    Server Error 500 with error message
 */
exports.searchFlights = async (req, res) => {
  // Should validate all required query fields

  const { departure, destination, departureDate } = req.query;

  try {
    const airportInfoRes = await axios.get(
      'https://api.api-ninjas.com/v1/airports',
      {
        params: {
          iata: departure,
        },
        headers: {
          'X-Api-Key': config.apiNinjasKey,
        },
      },
    );

    const tzLong = airportInfoRes.data[0].timezone;
    const tz = new Date()
      .toLocaleString('en-US', {
        timeZone: tzLong,
        hour12: false,
        timeZoneName: 'short',
      })
      .split(' ')[2];

    const startOfDay = new Date(`${departureDate}, 00:00 ${tz}`);
    const endOfDay = new Date(`${departureDate}, 23:59 ${tz}`);

    const flights = await Flight.find({
      departure,
      destination,
      departureTime: {
        $gte: startOfDay.toISOString(),
        $lte: endOfDay.toISOString(),
      },
      status: 'scheduled',
      $expr: { $lt: ['$reserved', '$capacity'] },
    });

    res.status(200).json({ flights, timezone: tzLong });
  } catch (err) {
    res.status(500).json({
      msg: 'Server error',
      err: err.message,
    });
  }
};

/**
 * @api {post} /flight/new  AddFlight
 * @apiName AddFlight
 * @apiGroup Flight
 * @apiDescription ToB use | Add a new flight (Admin permission required)
 *
 * @apiBody {Number} flightCode    The flight number without airline prefix
 * @apiBody {String} departure     The airport code of the departure
 * @apiBody {String} destination   The airport code of the destination
 * @apiBody {String} departureTime Departure time (Should be result of Date.toUTCString())
 * @apiBody {String} travelTime    Flight time in minutes
 * @apiBody {Number} capacity      Max number of passengers can be carried in this flight
 *
 * @apiSuccess  Return the added flight
 * @apiError    Server Error 500 with error message
 */
exports.addFlight = async (req, res) => {
  // Should validate all required body fields

  const {
    flightCode,
    departure,
    destination,
    departureTime,
    travelTime,
    capacity,
    price,
    currency,
  } = req.body;

  const d = new Date(departureTime);

  if (d.toUTCString() !== departureTime) {
    res.status(400).json({
      msg: 'Format of departure time is not valid',
    });
  }

  try {
    let flight = new Flight({
      airline: config.airline,
      flightNumber: config.airlineCode + ' ' + flightCode,
      departure,
      destination,
      departureTime,
      travelTime,
      capacity,
      price,
      currency,
    });

    flight = await flight.save();

    res.status(200).json({
      message: 'Flight is added successfully',
      flight,
    });
  } catch (err) {
    res.status(500).json({
      msg: 'Failed to add new flight',
      err: err.message,
    });
  }
};

/**
 * @api {put} /flight/:flightId/price  UpdatePrice
 * @apiName UpdatePrice
 * @apiGroup Flight
 * @apiDescription ToB use | Update price for a flight (Admin permission needed)
 *
 * @apiParam {String} flightId  The flight to be updated
 * @apiQuery {Number} newPrice  The new price
 *
 * @apiSuccess  Return the updated flight
 * @apiError    Server Error 500 with error message
 */
exports.updatePrice = async (req, res) => {
  try {
    // Check if flight exists
    let flight = await Flight.findById(req.params.flightId);
    if (!flight) {
      return res
        .status(400)
        .json({ errors: [{ msg: 'Cannot find the flight' }] });
    }

    const { newPrice } = req.query;

    if (newPrice === flight.price) {
      return res
        .status(400)
        .json({ errors: [{ msg: 'Please update with a different price' }] });
    }

    flight.price = newPrice;
    flight = await flight.save();

    res.status(200).json({
      message: 'Flight is updated successfully',
      flight,
    });
  } catch (err) {
    res.status(500).json({
      msg: 'Server Error',
      err: err.message,
    });
  }
};

/**
 * @api {put} /flight/:flightId/status  UpdateStatus
 * @apiName UpdateStatus
 * @apiGroup Flight
 * @apiDescription ToB use | Update status for a flight (Admin permission needed)
 *
 * @apiParam {String} flightId   The flight to be updated
 * @apiQuery {Number} newStatus  The new status
 *
 * @apiSuccess  Return the updated flight
 * @apiError    Server Error 500 with error message
 */
exports.updateStatus = async (req, res) => {
  try {
    // Check if flight exists
    let flight = await Flight.findById(req.params.flightId);
    if (!flight) {
      return res
        .status(400)
        .json({ errors: [{ msg: 'Cannot find the flight' }] });
    }

    const { newStatus } = req.query;

    if (newStatus === flight.status) {
      return res
        .status(400)
        .json({ errors: [{ msg: 'Please update with a different status' }] });
    }

    flight.status = newStatus;
    flight = await flight.save();

    res.status(200).json({
      message: 'Flight is updated successfully',
      flight,
    });
  } catch (err) {
    res.status(500).json({
      msg: 'Server Error',
      err: err.message,
    });
  }
};
