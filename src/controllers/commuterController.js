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

module.exports = {
    listRoutes,
    getRouteDetails,
    getTripDetails
    
  };