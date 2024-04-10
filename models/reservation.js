const mongoose = require('mongoose');

const reservationSchema = new mongoose.Schema(
  {
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
  { collection: 'reservations' },
);

module.exports = mongoose.model('Reservation', reservationSchema);
