const mongoose = require('mongoose');

const citySchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  cityName: {
    type: String,
    required: true,
  },
  country: {
    type: String,
  },
  favorite: {
    type: Boolean,
    default: false,
  },
  addedAt: {
    type: Date,
    default: Date.now,
  },
});

citySchema.index({ userId: 1, cityName: 1 }, { unique: true });

module.exports = mongoose.model('City', citySchema);
