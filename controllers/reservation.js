const Flight = require('../models/flight');
const Reservation = require('../models/reservation');

/**
 * @api {put} /reservation/confirm  ConfirmReservation
 * @apiName ConfirmReservation
 * @apiGroup Reservation
 * @apiDescription ToC use | Confirm an order after purchase
 *
 * @apiBody {String} reservationId
 * @apiBody {String} purchaseId
 *
 * @apiSuccess  Success message
 * @apiError    Server Error 500 with error message
 */
exports.confirmReservation = async (req, res) => {
  const { reservationId, purchaseId } = req.body;

  if (!reservationId || !purchaseId) {
    return res
      .status(400)
      .json({ errors: [{ msg: 'Missing order ID or purchase ID' }] });
  }

  try {
    // Find the reservation record
    let reservation = await Reservation.findById(reservationId);

    if (reservation.status !== 'pending') {
      return res.status(400).json({
        errors: [{ msg: 'The order is canceled or already confirmed' }],
      });
    }

    reservation.status = 'confirmed';
    reservation.purchaseId = purchaseId;
    await reservation.save();

    res.status(200).send('Your reservation is confirmed');
  } catch (err) {
    res.status(500).json({
      msg: 'Failed to confirm the reservation',
      err: err.message,
    });
  }
};

/**
 * @api {put} /reservation/autoCancel  CancelReservationAuto
 * @apiName CancelReservationAuto
 * @apiGroup Reservation
 * @apiDescription ToB use | Cancel an order when booking returning flight failed
 *
 * @apiBody {String} reservationId
 *
 * @apiSuccess  Success message
 * @apiError    Server Error 500 with error message
 */
exports.cancelReservationAuto = async (req, res) => {
  const { reservationId } = req.body;

  try {
    // Find the reservation record
    let reservation = await Reservation.findById(reservationId);

    // Check if it's already canceled
    if (reservation.status === 'canceled') {
      return res.status(400).json({
        errors: [{ msg: 'The order is already canceled' }],
      });
    }

    reservation.status = 'canceled';
    await reservation.save();

    // Find and update the flight
    let flight = await Flight.findById(reservation.flight);
    if (flight) {
      flight.reserved = flight.reserved - reservation.numPassengers;
      await flight.save();
    }

    // Should issue a refund here

    res.status(200).send('Your reservation is canceled');
  } catch (err) {
    res.status(500).json({
      msg: 'Failed to cancel the reservation',
      err: err.message,
    });
  }
};
