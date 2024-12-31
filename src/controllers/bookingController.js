const { sendEmail } = require('../services/emailService');
const Bus = require('../models/busModel');
const Route = require('../models/routeModel');
const Booking = require('../models/bookingModel');
const User = require('../models/userModel');
const QRCode = require('qrcode');
require('dotenv').config();

const bookSeats = async (req, res) => {
  try {
    const { from, to, date, seatIds, routeId, paymentDetails } = req.body;
    const userId = req.user._id;

    if (!from || !to || !date || !seatIds || !routeId || !Array.isArray(seatIds) || seatIds.length === 0) {
      return res.status(400).json({ success: false, message: 'Missing required fields or invalid seat list' });
    }

    const selectedDate = new Date(date);
    const weekday = selectedDate.toLocaleString('en-US', { weekday: 'long' });

    const route = await Route.findById(routeId).populate('assignedBuses.bus');
    if (!route) {
      return res.status(404).json({ success: false, message: 'Route not found' });
    }

    const schedule = route.schedules.find((s) => s.operatingDays.includes(weekday));
    if (!schedule || !schedule.isActive) {
      return res.status(400).json({ success: false, message: 'Route is not active on this day' });
    }

    const bus = route.assignedBuses.find((bus) => bus.isActive);
    if (!bus) {
      return res.status(404).json({ success: false, message: 'No available bus for this route' });
    }

    const busDoc = await Bus.findById(bus.bus);
    const seatMatrix = busDoc.getSeatMatrix();

    const requiresPayment = ['luxury', 'semiLuxury'].includes(busDoc.busType);

    if (requiresPayment) {
      if (!paymentDetails || !paymentDetails.method) {
        return res.status(400).json({
          success: false,
          message: 'Payment details required for luxury/semi-luxury bus booking',
          requiredFields: ['method', 'paymentDetails based on method'],
        });
      }

      switch (paymentDetails.method) {
        case 'credit_card':
        case 'debit_card':
          if (!paymentDetails.cardNumber || !paymentDetails.cardType) {
            return res.status(400).json({ success: false, message: 'Invalid card details' });
          }
          break;
        case 'upi':
          if (!paymentDetails.upiId) {
            return res.status(400).json({ success: false, message: 'UPI ID is required' });
          }
          break;
        case 'net_banking':
          if (!paymentDetails.bankReference) {
            return res.status(400).json({ success: false, message: 'Bank reference is required' });
          }
          break;
        default:
          return res.status(400).json({ success: false, message: 'Invalid payment method' });
      }
    }

    const unavailableSeats = [];
    const seatDetails = [];
    seatIds.forEach((seatId) => {
      let seatFound = false;
      seatMatrix.forEach((row) => {
        row.forEach((seat) => {
          if (seat._id.toString() === seatId) {
            seatFound = true;
            if (!seat.isBlocked) {
              seatDetails.push({ seatId, label: seat.id });
            } else {
              unavailableSeats.push(seatId);
            }
          }
        });
      });
      if (!seatFound) unavailableSeats.push(seatId);
    });

    if (unavailableSeats.length > 0) {
      return res.status(400).json({ success: false, message: `Seats not available: ${unavailableSeats.join(', ')}` });
    }

    const existingBookings = await Booking.find({
      'seats.seatId': { $in: seatIds },
      date,
      status: { $ne: 'cancelled' },
    });

    if (existingBookings.length > 0) {
      const bookedSeatIds = existingBookings.flatMap((booking) => booking.seats.map((seat) => seat.seatId));
      return res.status(400).json({ success: false, message: `Seats already booked: ${bookedSeatIds.join(', ')}` });
    }

    const farePerSeat = route.calculateFare(from, to);
    if (!farePerSeat) {
      return res.status(400).json({ success: false, message: `No fare defined between ${from} and ${to}` });
    }

    const totalFare = farePerSeat * seatIds.length;
    const paymentInfo = requiresPayment
      ? {
          required: true,
          status: 'completed',
          details: {
            method: paymentDetails.method,
            paidAmount: totalFare,
            paidAt: new Date(),
            ...(paymentDetails.method === 'credit_card' || paymentDetails.method === 'debit_card'
              ? {
                  cardDetails: {
                    lastFourDigits: paymentDetails.cardNumber.slice(-4),
                    cardType: paymentDetails.cardType,
                  },
                }
              : {}),
            ...(paymentDetails.method === 'upi' ? { upiId: paymentDetails.upiId } : {}),
            ...(paymentDetails.method === 'net_banking' ? { bankReference: paymentDetails.bankReference } : {}),
          },
        }
      : { required: false, status: 'completed' };

    const booking = new Booking({
      user: userId,
      seats: seatDetails,
      routeId,
      date,
      totalFare,
      payment: paymentInfo,
      status: 'confirmed',
    });

    const savedBooking = await booking.save();

    seatIds.forEach((seatId) => {
      seatMatrix.forEach((row) => {
        row.forEach((seat) => {
          if (seat._id.toString() === seatId) seat.isBlocked = true;
        });
      });
    });

    await busDoc.save();

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    const emailVariables = {
      firstName: user.name.split(' ')[0],
      routeName: route.name,
      seatNumbers: seatDetails.map((seat) => seat.label).join(', '),
      date: selectedDate.toISOString(),
      price: `RS ${totalFare}`,
      paymentStatus: 'Confirmed',
      paymentMethod: requiresPayment ? paymentDetails.method : 'Not Required',
      bookingLink: `${process.env.API_URL}/booking-details/${savedBooking._id}`,
    };

    await sendEmail(user.email, 'Ticket Booking Confirmation', 'ticketBooking', emailVariables);

    res.status(200).json({
      success: true,
      message: 'Booking confirmed successfully',
      bookingId: savedBooking._id,
    });
  } catch (error) {
    console.error('Booking error:', error);
    res.status(500).json({ success: false, message: 'Error during booking', error: error.message });
  }
};

const cancelBooking = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const booking = await Booking.findById(bookingId);

    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    const bookingDate = new Date(booking.date);
    const now = new Date();
    const hoursUntilDeparture = (bookingDate - now) / (1000 * 60 * 60);

    if (hoursUntilDeparture < 24) {
      return res.status(400).json({
        success: false,
        message: 'Cancellation not allowed less than 24 hours before departure',
      });
    }

    booking.status = 'cancelled';
    if (booking.payment.status === 'completed') {
      booking.payment.status = 'refunded';
    }

    await booking.save();

    const route = await Route.findById(booking.routeId).populate('assignedBuses.bus');
    const bus = route.assignedBuses.find((bus) => bus.isActive);
    if (bus) {
      const busDoc = await Bus.findById(bus.bus);
      const seatMatrix = busDoc.getSeatMatrix();
      seatMatrix.forEach((row) => {
        row.forEach((seat) => {
          if (seat._id.toString() === booking.seatId) {
            seat.isBlocked = false;
          }
        });
      });
      await busDoc.save();
    }

    const user = await User.findById(booking.user);
    const emailVariables = {
      firstName: user.name.split(' ')[0],
      bookingId: booking._id,
      refundStatus: booking.payment.status === 'refunded' ? 'Refund initiated' : 'No payment to refund',
    };

    await sendEmail(user.email, 'Booking Cancellation', 'bookingCancellation', emailVariables);

    res.status(200).json({
      success: true,
      message: 'Booking cancelled successfully',
    });
  } catch (error) {
    console.error('Cancellation error:', error);
    res.status(500).json({
      success: false,
      message: 'Error cancelling booking',
      error: error.message,
    });
  }
};

const getUserBookings = async (req, res) => {
  try {
    const userId = req.user._id;

    const bookings = await Booking.find({ user: userId }).populate('routeId', 'name').sort({ createdAt: -1 });

    if (bookings.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No bookings found for this user',
      });
    }

    res.status(200).json({
      success: true,
      bookings,
    });
  } catch (error) {
    console.error('Error fetching user bookings:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching user bookings',
      error: error.message,
    });
  }
};

const getAllBookings = async (req, res) => {
  try {
    const bookings = await Booking.find()
      .populate('user', 'name email')
      .populate('routeId', 'name')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      bookings,
    });
  } catch (error) {
    console.error('Error fetching all bookings:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching all bookings',
      error: error.message,
    });
  }
};

const getBookingDetails = async (req, res) => {
  try {
    const bookingId = req.params.bookingId;

    const qrCodeData = await QRCode.toDataURL(`${process.env.API_URL}/booking-details/${bookingId}`);

    const booking = await Booking.findById(bookingId)
      .populate('user', 'name email')
      .populate('routeId', 'name')
      .populate({
        path: 'routeId.stops',
        select: 'name location distanceFromStart estimatedTime',
      });

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found',
      });
    }
    booking.qrCodeData = qrCodeData;
    
    res.render('booking', { booking: booking });
  } catch (error) {
    console.error('Error fetching booking details:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching booking details',
      error: error.message,
    });
  }
};

module.exports = {
  bookSeats,
  cancelBooking,
  getUserBookings,
  getAllBookings,
  getBookingDetails,
};
