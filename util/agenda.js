const Agenda = require('agenda');
const mongoose = require('mongoose');
const Flight = require('../models/flight');
const Reservation = require('../models/reservation');
const config = require('../config/config.json');

const agenda = new Agenda({
  db: {
    address: config.mongodbConnectURI,
    options: {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      dbName: config.dbName,
    },
  },
});

agenda.define('revoke reservation', async (job) => {
  const { reservationId, flightId } = job.attrs.data;

  try {
    let reservation = await Reservation.findById(reservationId);

    if (reservation.status === 'pending') {
      const session = await mongoose.startSession();

      await session
        .withTransaction(async () => {
          reservation.status = 'canceled';
          await reservation.save();

          let flight = await Flight.findById(flightId);
          if (flight) {
            flight.reserved = flight.reserved - reservation.numPassengers;
            await flight.save();
          }
        })
        .catch((err) => {
          session.endSession();
          throw err;
        });

      session.endSession();
    }
  } catch (err) {
    console.log(err.message);
  }
});

module.exports = agenda;
