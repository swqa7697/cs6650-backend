const Agenda = require('agenda');
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

    // Cancel the order if it's still pending (not purchased)
    if (reservation.status === 'pending') {
      reservation.status = 'canceled';
      await reservation.save();

      // Find and update the flight
      let flight = await Flight.findById(flightId);
      if (flight) {
        flight.reserved = flight.reserved - reservation.numPassengers;
        await flight.save();
      }
    }
  } catch (err) {
    console.log(err.message);
  }
});

module.exports = agenda;
