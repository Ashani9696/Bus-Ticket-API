const Bus = require('../models/busModel');
const Booking = require('../models/bookingModel');
const Payment = require('../models/paymentModel');
const Route = require('../models/routeModel');
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

  module.exports = {
    getMyBuses,
    updateBus,
    deleteBus
  };