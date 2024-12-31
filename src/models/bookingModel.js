const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  seats: [
    {
      seatId: { type: String, required: true },
      label: String,
    },
  ],
  routeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Route', required: true },
  date: { type: Date, required: true },
  totalFare: { type: Number, required: true },
  payment: {
    required: { type: Boolean, default: false },
    status: {
      type: String,
      enum: ['pending', 'completed', 'failed', 'refunded'],
      default: 'pending',
    },
    details: {
      method: {
        type: String,
        enum: ['credit_card', 'debit_card', 'upi', 'net_banking'],
        required: function () {
          return this.payment.required;
        },
      },
      transactionId: String,
      paidAmount: Number,
      paidAt: Date,
      cardDetails: {
        lastFourDigits: String,
        cardType: String,
      },
      upiId: String,
      bankReference: String,
    },
  },
  status: {
    type: String,
    enum: ['confirmed', 'cancelled', 'pending'],
    default: 'pending',
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Booking', bookingSchema);
