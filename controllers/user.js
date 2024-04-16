const mongoose = require('mongoose');
const agenda = require('../util/agenda');
const { v4: uuidv4 } = require('uuid');
const Flight = require('../models/flight');
const User = require('../models/user');
const Reservation = require('../models/reservation');

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
    // Find the user
    let user = await User.findOne({ userId: req.userSub });
    // Return an empty result if user's record does not exist in this airline
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
 * @apiBody {String} orderId (Optional)
 *
 * @apiSuccess  Return success message, the reservation and the flight
 * @apiError    Server Error 500 with error message
 */
exports.bookFlight = async (req, res) => {
  const { flightId, numPassengers, passengerInfo } = req.body;

  let { orderId } = req.body;
  if (!orderId) {
    orderId = uuidv4() + Date.now();
  }

  // ## Transaction starts here ##
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // Check info provided
    if (passengerInfo.length !== numPassengers) {
      return res.status(400).json({
        errors: [
          { msg: 'Number of passengers does not match the provided info' },
        ],
      });
    }

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

    // Prepare updated data
    let reservation;
    reservation = new Reservation({
      orderId,
      flight: flightId,
      numPassengers,
      passengers: passengerInfo,
    });

    flight.reserved = flight.reserved + numPassengers;

    // Make the reservation
    reservation = await reservation.save({ session: session });
    flight = await flight.save({ session: session });

    // Record the order to the user
    let user = await User.findOne({ userId: req.userSub });

    if (!user) {
      user = new User({
        userId: req.userSub,
        reservations: [],
      });
    }

    user.reservations.push({ reservation: reservation._id });
    await user.save({ session: session });

    // ## Commit transaction if reservation is success ##
    await session.commitTransaction();
    session.endSession();

    // Set order time out for purchase
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
    // ## Abort transaction if error occurs. Changes should be rolled back ##
    await session.abortTransaction();
    session.endSession();

    res.status(500).json({
      msg: 'Failed to book the flight',
      err: err.message,
    });
  }
};
