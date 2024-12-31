const Bus = require('../models/busModel');

const createBus = async (req, res) => {
  try {
    const busData = {
      registrationNumber: req.body.registrationNumber,
      model: req.body.model,
      manufacturer: req.body.manufacturer,
      capacity: req.body.capacity,
      features: req.body.features,
    };

    const bus = new Bus(busData);
    await bus.save();

    res.status(201).json({
      success: true,
      data: bus,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Bus with this registration number already exists',
      });
    }
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const getAllBuses = async (req, res) => {
  try {
    const { page = 1, limit = 10, status, maintenanceStatus, sortBy = 'registrationNumber' } = req.query;

    const query = {};
    if (status) query.status = status;
    if (maintenanceStatus) query['maintenance.status'] = maintenanceStatus;

    const buses = await Bus.find(query)
      .sort(sortBy)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .exec();

    const count = await Bus.countDocuments(query);

    res.json({
      success: true,
      data: buses,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const getBusById = async (req, res) => {
  try {
    const bus = await Bus.findById(req.params.id).populate('currentRoute', 'routeNumber name');

    if (!bus) {
      return res.status(404).json({
        success: false,
        message: 'Bus not found',
      });
    }

    res.json({
      success: true,
      data: bus,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const updateBus = async (req, res) => {
  try {
    const updateData = { ...req.body };
    delete updateData.registrationNumber;

    const bus = await Bus.findByIdAndUpdate(req.params.id, { $set: updateData }, { new: true, runValidators: true });

    if (!bus) {
      return res.status(404).json({
        success: false,
        message: 'Bus not found',
      });
    }

    res.json({
      success: true,
      data: bus,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const deleteBus = async (req, res) => {
  try {
    const bus = await Bus.findById(req.params.id);

    if (!bus) {
      return res.status(404).json({
        success: false,
        message: 'Bus not found',
      });
    }

    await bus.remove();

    res.json({
      success: true,
      message: 'Bus deleted successfully',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  createBus,
  getAllBuses,
  getBusById,
  updateBus,
  deleteBus,
};
