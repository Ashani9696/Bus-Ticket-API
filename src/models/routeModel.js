const mongoose = require('mongoose');

const routeSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    startPoint: { type: String, required: true },
    endPoint: { type: String, required: true },
    schedule: {
      day: { type: String, required: true },
      time: { type: String, required: true },
    },
    buses: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Bus',
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model('Route', routeSchema);
