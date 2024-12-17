const mongoose = require('mongoose');

const busSchema = new mongoose.Schema(
  {
    route: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Route',
      required: true,
    },
    busNumber: { type: String, required: true, unique: true },
    capacity: { type: Number, required: true },
    operator: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Bus', busSchema);
