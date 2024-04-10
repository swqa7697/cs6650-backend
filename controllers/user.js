const mongoose = require('mongoose');
const Flight = require('../models/flight');
const User = require('../models/user');
const Reservation = require('../models/reservation');
const agenda = require('../util/agenda');

const PURCHASE_TIME_OUT = 15;

/**
 * @api {get} /user/reservations  GetReservations
 * @apiName GetReservations
 * @apiGroup User
 * @apiDescription ToC use | Retrieve user's booking history
 *
 * @apiSuccess  {Object[]} Array of reservations
 * @apiError    Server Error 500 with error message
 */
exports.getReservations = async (req, res) => {
  try {
    let user = await User.findOne({ userId: res.userSub });

    if (!user) {
      return res.status(200).json([]);
    }

    await user.populate('reservations.reservation');
    await user.populate('reservations.reservation.flight');

    res.status(200).json(user.reservations);
  } catch (err) {
    res.status(500).json({
      msg: 'Failed to retrieve booking history',
      err: err.message,
    });
  }
};

/**
 * @api {post} /user/book  BookFlight
 * @apiName BookFlight
 * @apiGroup User
 * @apiDescription ToC use | User books a flight
 *
 * @apiBody {String} flightId
 * @apiBody {Number} numPassengers
 * @apiBody [{String, String, String}] passengerInfo
 *
 * @apiSuccess  Return success message, the reservation and the flight
 * @apiError    Server Error 500 with error message
 */
exports.bookFlight = async (req, res) => {
  const { flightId, numPassengers, passengerInfo } = req.body;

  if (passengerInfo.length !== numPassengers) {
    return res.status(400).json({
      errors: [
        { msg: 'Number of passengers does not match the provided info' },
      ],
    });
  }

  try {
    // Check if flight exists
    let flight = await Flight.findById(flightId);
    if (!flight) {
      return res
        .status(400)
        .json({ errors: [{ msg: 'Cannot find the flight' }] });
    }

    // Check availability
    if (flight.reserved + numPassengers > flight.capacity) {
      return res.status(401).json({ errors: [{ msg: 'No available seat' }] });
    }

    const session = await mongoose.startSession();

    let reservation;

    await session
      .withTransaction(async () => {
        reservation = new Reservation({
          flight: flightId,
          numPassengers,
          passengers: passengerInfo,
        });

        flight.reserved = flight.reserved + numPassengers;

        reservation = await reservation.save();
        flight = await flight.save();

        let user = await User.findOne({ userId: res.userSub });

        if (!user) {
          user = new User({
            userId: res.userSub,
            reservations: [],
          });
        }

        user.reservations.push({ reservation: reservation._id });
        await user.save();
      })
      .catch((err) => {
        session.endSession();
        throw err;
      });

    session.endSession();

    await agenda.schedule(
      `in ${PURCHASE_TIME_OUT} minutes`,
      'revoke reservation',
      {
        reservationId: reservation._id,
        flightId: flight._id,
      },
    );

    res.status(200).json({
      message: 'Your flight is successfully booked. Please proceed to purchase',
      reservation,
      flight,
    });
  } catch (err) {
    res.status(500).json({
      msg: 'Failed to book the flight',
      err: err.message,
    });
  }
};
