const Route = require('../models/routeModel');
const Trip = require('../models/tripModel');
const Booking = require('../models/bookingModel');
const Payment = require('../models/paymentModel');
const Bus = require('../models/busModel');

const listRoutes = async (req, res) => {
  try {
    const routes = await Route.find().populate('buses');
    res.status(200).json(routes);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching routes', error });
  }
};

const getRouteDetails = async (req, res) => {
  const { routeId } = req.params;
  try {
    const route = await Route.findById(routeId).populate('buses');
    if (!route) return res.status(404).json({ message: 'Route not found' });
    res.status(200).json(route);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching route details', error });
  }
};

const getTripDetails = async (req, res) => {
  const { tripId } = req.params;
  try {
    const trip = await Trip.findById(tripId).populate('bus route operator');
    if (!trip) return res.status(404).json({ message: 'Trip not found' });
    res.status(200).json(trip);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching trip details', error });
  }
};
const makeBooking = async (req, res) => {
  const { tripId, seatNumber, dueAmount } = req.body;
  try {
    const trip = await Trip.findById(tripId);
    if (!trip || trip.availableSeats <= 0) {
      return res.status(400).json({ message: 'No seats available or invalid trip' });
    }

    const existingBooking = await Booking.findOne({
      bus: trip.bus,
      seatNumber,
    });
    if (existingBooking) {
      return res.status(400).json({ message: 'Seat is already booked' });
    }

    const formattedDueAmount = parseFloat(dueAmount).toFixed(2);

    const booking = new Booking({
      commuter: req.user._id,
      bus: trip.bus,
      trip: tripId,
      route: trip.route,
      seatNumber,
      dueAmount: formattedDueAmount,
    });

    await booking.save();

    trip.availableSeats -= Number(seatNumber);
    await trip.save();

    res.status(201).json({ message: 'Booking successful', booking });
  } catch (error) {
    res.status(500).json({ message: 'Error making booking', error });
  }
};

const getBookingDetails = async (req, res) => {
  const { bookingId } = req.params;
  try {
    const booking = await Booking.findById(bookingId).populate('bus commuter');
    if (!booking) return res.status(404).json({ message: 'Booking not found' });
    res.status(200).json(booking);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching booking details', error });
  }
};

const modifyBooking = async (req, res) => {
  const { bookingId } = req.params;
  const { seatNumber, dueAmount } = req.body;

  try {
    const booking = await Booking.findById(bookingId);
    if (!booking) return res.status(404).json({ message: 'Booking not found' });

    const existingBooking = await Booking.findOne({
      bus: booking.bus,
      seatNumber,
      dueAmount,
    });
    if (existingBooking) {
      return res.status(400).json({ message: 'Seat is already booked' });
    }

    const trip = await Trip.findById(booking.trip);
    if (!trip) {
      return res.status(404).json({ message: 'Associated trip not found' });
    }

    const seatDifference = seatNumber - booking.seatNumber;

    if (seatDifference > 0) {
      if (trip.availableSeats < seatDifference) {
        return res.status(400).json({ message: 'Not enough available seats' });
      }
      trip.availableSeats -= seatDifference;
    } else if (seatDifference < 0) {
      trip.availableSeats += Math.abs(seatDifference);
    }

    await trip.save();

    booking.seatNumber = seatNumber;
    await booking.save();

    res.status(200).json({ message: 'Booking updated successfully', booking });
  } catch (error) {
    res.status(500).json({ message: 'Error updating booking', error });
  }
};

const cancelBooking = async (req, res) => {
  const { bookingId } = req.params;

  try {
    const booking = await Booking.findByIdAndUpdate(bookingId, { status: 'cancelled' }, { new: true });
    if (!booking) return res.status(404).json({ message: 'Booking not found' });

    const trip = await Trip.findOne({ bus: booking.bus });
    if (trip) {
      trip.availableSeats += Number(booking.seatNumber);
      await trip.save();
    }

    res.status(200).json({ message: 'Booking cancelled successfully', booking });
  } catch (error) {
    res.status(500).json({ message: 'Error cancelling booking', error });
  }
};

const makePayment = async (req, res) => {
  const { bookingId, amount, paymentMethod } = req.body;

  try {
    const booking = await Booking.findById(bookingId);
    if (!booking) return res.status(404).json({ message: 'Booking not found' });

    const payment = new Payment({
      booking: bookingId,
      amount,
      paymentMethod,
      status: 'completed',
    });

    await payment.save();

    booking.payment_status = 'paid';
    booking.status = 'completed';

    await booking.save();

    res.status(201).json({ message: 'Payment successful', payment });
  } catch (error) {
    res.status(500).json({ message: 'Error processing payment', error });
  }
};

const listBookings = async (req, res) => {
  try {
    const bookings = await Booking.find({ commuter: req.user._id })
      .populate('bus')
      .populate('commuter')
      .populate('trip')
      .populate('route');
    res.status(200).json(bookings);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching bookings', error });
  }
};

const listTrips = async (req, res) => {
  try {
    const trips = await Trip.find().populate('bus route operator').sort({ departureDate: 1 });
    res.status(200).json(trips);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching trips', error });
  }
};

module.exports = {
  listRoutes,
  getRouteDetails,
  getTripDetails,
  makeBooking,
  getBookingDetails,
  cancelBooking,
  modifyBooking,
  makePayment,
  listBookings,
  listTrips,
};
