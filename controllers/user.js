const Flight = require('../models/flight');
const User = require('../models/user');
const Reservation = require('../models/reservation');

/**
 * @api {get} /user/reservations  GetReservations
 * @apiName GetReservations
 * @apiGroup User
 * @apiDescription ToC use | Retrieve user's booking history
 *
 * @apiSuccess  {Object[]} Array of reservations
 * @apiError    Server Error 500 with error message
 */
