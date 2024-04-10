const mongoose = require('mongoose');
const constants = require('../util/constants');

const flightSchema = new mongoose.Schema(
  {
    airline: {
      type: String,
      required: true,
    },
    flightNumber: {
      type: String,
      required: true,
    },
    departure: {
      type: String,
      required: true,
    },
    destination: {
      type: String,
      required: true,
    },
    // Use UTC time for simplicity
    departureTime: {
      type: Date,
      required: true,
    },
    // A reference used for search, also in UTC time
    departureDate: {
      type: String,
      required: true,
    },
    // Flight time in minutes
    travelTime: {
      type: Number,
      required: true,
    },
    capacity: {
      type: Number,
      required: true,
    },
    reserved: {
      type: Number,
      default: 0,
    },
    price: {
      type: Number,
      required: true,
    },
    currency: {
      type: String,
      required: true,
      enum: constants.currencies,
    },
    status: {
      type: String,
      enum: ['scheduled', 'boarding', 'departed', 'arrived'],
      default: 'scheduled',
    },
  },
  { collection: 'flights' },
);

flightSchema.index({ flightNumber: 1, departureTime: 1 }, { unique: true });

module.exports = mongoose.model('Flight', flightSchema);
