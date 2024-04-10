const mongoose = require('mongoose');
const reservation = require('./reservation');

const userSchema = new mongoose.Schema(
  {
    // Store the userSub used by Cognito
    userId: {
      type: String,
      required: true,
      unique: true,
    },
    reservations: [
      {
        reservation: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Reservation',
        },
      },
    ],
  },
  { collection: 'users' },
);

module.exports = mongoose.model('User', userSchema);
