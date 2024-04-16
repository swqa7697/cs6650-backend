const mongoose = require('mongoose');

const reservationSchema = new mongoose.Schema(
  {
    orderId: {
      type: String,
      required: true,
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
