const mongoose = require('mongoose');

const permitSchema = new mongoose.Schema(
  {
    permitNumber: { type: String, required: true, unique: true },
    issueDate: { type: Date, required: true },
    expiryDate: { type: Date, required: true },
    route: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Route',
      required: true,
    },
    bus: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Bus',
      required: true,
    },
    operator: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    status: {
      type: String,
      enum: ['active', 'expired', 'suspended'],
      default: 'active',
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Permit', permitSchema);
