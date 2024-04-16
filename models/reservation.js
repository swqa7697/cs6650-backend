const mongoose = require('mongoose');

const reservationSchema = new mongoose.Schema(
  {
    // An id generated for an order (may include both departure and return flights)
    // Only guarantee to be unique to each user (not global unique guaranteed)
    orderId: {
      type: String,
      required: true,
    },
    // An id returned by paypal
    purchaseId: {
      type: String,
    },
    flight: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Flight',
    },
    numPassengers: {
      type: Number,
      required: true,
    },
    passengers: [
      {
        firstname: {
          type: String,
          required: true,
        },
        lastname: {
          type: String,
          required: true,
        },
        passport: {
          type: String,
          required: true,
        },
      },
    ],
    status: {
      type: String,
      enum: ['pending', 'confirmed', 'canceled'],
      default: 'pending',
    },
  },
  { timestamps: true },
  { collection: 'reservations' },
);

module.exports = mongoose.model('Reservation', reservationSchema);
