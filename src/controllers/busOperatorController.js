const Bus = require('../models/busModel');
const Booking = require('../models/bookingModel');
const Payment = require('../models/paymentModel');
const Route = require('../models/routeModel');
const Trip = require('../models/tripModel');
const mongoose = require('mongoose');

const getMyBuses = async (req, res) => {
  try {
    const buses = await Bus.find({ operator: req.user._id }).populate('route');
    res.status(200).json({ success: true, data: buses });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching buses',
      error: error.message,
    });
  }
};
const updateBus = async (req, res) => {
  const { busId } = req.params;
  const updateData = req.body;
  try {
    const updatedBus = await Bus.findOneAndUpdate({ _id: busId, operator: req.user._id }, updateData, {
      new: true,
    });

    if (!updatedBus) {
      return res.status(404).json({ message: 'Bus not found or not owned by you' });
    }

    res.status(200).json(updatedBus);
  } catch (error) {
    res.status(400).json({ message: 'Error updating bus', error });
  }
};

const deleteBus = async (req, res) => {
  const { busId } = req.params;
  try {
    const bus = await Bus.findOneAndDelete({
      _id: busId,
      operator: req.user._id,
    });
    if (!bus) return res.status(404).json({ message: 'Bus not found' });
    res.status(200).json({ message: 'Bus deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting bus', error });
  }
};
const getBookings = async (req, res) => {
  try {
    const bookings = await Booking.find().populate('commuter').populate('bus');
    res.status(200).json(bookings);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching bookings', error });
  }
};

const cancelBooking = async (req, res) => {
  const { bookingId } = req.params;
  try {
    const booking = await Booking.findOneAndUpdate({ _id: bookingId }, { status: 'cancelled' }, { new: true });
    if (!booking) return res.status(404).json({ message: 'Booking not found' });
    res.status(200).json({ message: 'Booking cancelled successfully', booking });
  } catch (error) {
    res.status(500).json({ message: 'Error cancelling booking', error });
  }
};

const getPayments = async (req, res) => {
  try {
    const buses = await Bus.find({ operator: req.user._id }).select('_id');

    const busIds = buses.map((bus) => bus._id);

    const payments = await Payment.find({ bus: { $in: busIds } })
      .populate('booking')
      .populate('bus');

    res.status(200).json(payments);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching payments', error });
  }
};

const createTrip = async (req, res) => {
  const { bus, ticket_price, availableSeats, route } = req.body;

  try {
    const foundBus = await Bus.findOne({ _id: bus, operator: req.user._id });
    if (!foundBus) return res.status(404).json({ message: 'Bus not found or not owned by you' });

    const foundRoute = await Route.findById(route);
    if (!foundRoute) return res.status(404).json({ message: 'Route not found' });

    const newTrip = new Trip({
      bus,
      ticket_price: mongoose.Types.Decimal128.fromString(ticket_price.toString()),
      availableSeats,
      route,
      operator: req.user._id,
    });

    await newTrip.save();
    res.status(201).json({ message: 'Trip created successfully', newTrip });
  } catch (error) {
    res.status(400).json({ message: 'Error creating trip', error });
  }
};

const updateTrip = async (req, res) => {
  const { tripId } = req.params;
  const updateData = req.body;

  try {
    const trip = await Trip.findOneAndUpdate({ _id: tripId, operator: req.user._id }, updateData, {
      new: true,
    });

    if (!trip) return res.status(404).json({ message: 'Trip not found or not owned by you' });

    res.status(200).json({ message: 'Trip updated successfully', trip });
  } catch (error) {
    res.status(400).json({ message: 'Error updating trip', error });
  }
};

const deleteTrip = async (req, res) => {
  const { tripId } = req.params;

  try {
    const trip = await Trip.findOneAndDelete({
      _id: tripId,
      operator: req.user._id,
    });
    if (!trip) return res.status(404).json({ message: 'Trip not found or not owned by you' });

    res.status(200).json({ message: 'Trip deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting trip', error });
  }
};

const getAllTrips = async (req, res) => {
  try {
    const trips = await Trip.find({ operator: req.user._id }).populate('bus').populate('route');
    res.status(200).json(trips);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching trips', error });
  }
};

const getTripDetails = async (req, res) => {
  const { tripId } = req.params;

  try {
    const trip = await Trip.findOne({ _id: tripId, operator: req.user._id }).populate('bus').populate('route');

    if (!trip) return res.status(404).json({ message: 'Trip not found or not owned by you' });

    res.status(200).json(trip);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching trip details', error });
  }
};

module.exports = {
  getMyBuses,
  updateBus,
  deleteBus,
  getBookings,
  cancelBooking,
  getPayments,
  createTrip,
  updateTrip,
  deleteTrip,
  getAllTrips,
  getTripDetails,
};
