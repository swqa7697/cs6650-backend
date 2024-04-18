const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors');
const flightRoutes = require('./routes/flight');
const userRoutes = require('./routes/user');
const reservationRoutes = require('./routes/reservation');
const agenda = require('./util/agenda');
const config = require('./config/config.json');
const port = process.env.PORT || 3000;

app = express();

app.use(cors());
app.disable('etag');
app.use(
  express.json({
    verify: (req, res, buf) => {
      req.rawBody = buf;
    },
  }),
);
app.use(bodyParser.urlencoded({ extended: false }));

app.use('/flight', flightRoutes);
app.use('/user', userRoutes);
app.use('/reservation', reservationRoutes);
app.get('/', (req, res) => {
  res.status(200).json({
    message: 'Successfully access Airline Reservation System API.',
  });
});

mongoose.set('debug', true);
mongoose
  .connect(config.mongodbConnectURI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    dbName: config.dbName,
  })
  .then(() => {
    console.log('Database Connection is ready...');
    app.listen(port, () => {
      console.log(`Server is listening on port ${port}`);
    });
  })
  .catch((err) => {
    console.log(err);
  });

agenda.start().then(() => {
  console.log('Agenda connected to Database and started...');
});

module.exports = app;
