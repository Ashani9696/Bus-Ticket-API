const Route = require('../models/routeModel');
const mongoose = require('mongoose');
const ErrorHandler = require('../utils/errorHandler');

const createRoute = async (req, res) => {
  try {
    const {
      routeNumber,
      name,
      category,
      stops,
      schedules,
      fares,
      distance,
      estimatedDuration,
      restrictions,
      features,
    } = req.body;

    const newRoute = new Route({
      routeNumber,
      name,
      category,
      stops,
      schedules,
      fares,
      distance,
      estimatedDuration,
      restrictions,
      features,
      metadata: {
        updatedBy: req.user._id,
      },
    });

    const savedRoute = await newRoute.save();
    res.status(201).json({
      success: true,
      message: 'Route created successfully',
      route: savedRoute,
    });
  } catch (error) {
    console.error('Create route error:', error);
    res.status(400).json({
      success: false,
      message: 'Failed to create route',
      error: error.message,
    });
  }
};

const getAllRoutes = async (req, res) => {
  try {
    const { page = 1, limit = 10, category, from, to, date, sort = '-createdAt' } = req.query;

    const filter = {};
    if (category) filter.category = category;
    filter.status = { $ne: 'Discontinued' };

    if (from && to) {
      filter['stops.name'] = { $all: [from, to] };
    }

    if (date) {
      const selectedDate = new Date(date);
      const weekday = selectedDate.toLocaleString('en-US', { weekday: 'long' });

      filter['schedules.operatingDays'] = weekday;
    }

    const routes = await Route.find(filter)
      .sort(sort)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .exec();

    const total = await Route.countDocuments(filter);

    res.status(200).json({
      success: true,
      routes,
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      totalRoutes: total,
    });
  } catch (error) {
    console.error('Get routes error:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving routes',
      error: error.message,
    });
  }
};

const getRouteById = async (req, res) => {
  try {
    const route = await Route.findById(req.params.id);

    if (!route || route.status === 'Discontinued') {
      return res.status(404).json({
        success: false,
        message: 'Route not found',
      });
    }

    res.status(200).json({
      success: true,
      route,
    });
  } catch (error) {
    console.error('Get route error:', error);
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Error retrieving route',
      error: error.message,
    });
  }
};

const updateRoute = async (req, res) => {
  try {
    const updates = {
      ...req.body,
      'metadata.lastUpdated': Date.now(),
      'metadata.updatedBy': req.user._id,
    };

    const updatedRoute = await Route.findByIdAndUpdate(
      req.params.id,
      { $set: updates },
      { new: true, runValidators: true }
    );

    if (!updatedRoute) {
      throw new ErrorHandler(404, 'Route not found');
    }

    res.status(200).json({
      success: true,
      message: 'Route updated successfully',
      route: updatedRoute,
    });
  } catch (error) {
    console.error('Update route error:', error);
    res.status(error.statusCode || 400).json({
      success: false,
      message: 'Failed to update route',
      error: error.message,
    });
  }
};

const deleteRoute = async (req, res) => {
  try {
    const route = await Route.findByIdAndDelete(req.params.id);

    if (!route) {
      throw new ErrorHandler(404, 'Route not found');
    }

    res.status(200).json({
      success: true,
      message: 'Route deleted successfully',
    });
  } catch (error) {
    console.error('Delete route error:', error);
    res.status(error.statusCode || 500).json({
      success: false,
      message: 'Failed to delete route',
      error: error.message,
    });
  }
};


const calculateFare = async (req, res) => {
  try {
    const { routeId, startStop, endStop } = req.query;

    if (!routeId || !startStop || !endStop) {
      return res.status(400).json({
        success: false,
        message: 'Missing required parameters: routeId, startStop, and endStop are required',
      });
    }

    if (!mongoose.Types.ObjectId.isValid(routeId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid routeId format',
      });
    }

    const route = await Route.findById(routeId);

    if (!route || route.status === 'Discontinued') {
      return res.status(404).json({
        success: false,
        message: 'Route not found',
      });
    }

    const fare = route.calculateFare(startStop, endStop);

    if (fare === null) {
      return res.status(400).json({
        success: false,
        message: 'Fare calculation not possible for the specified stops',
      });
    }

    return res.status(200).json({
      success: true,
      fare,
    });
  } catch (error) {
    console.error('Calculate fare error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

const assignBusesToRoute = async (req, res) => {
  try {
    const { routeId } = req.params;
    const { buses } = req.body;

    if (!routeId || !buses || !Array.isArray(buses)) {
      return res.status(400).json({
        success: false,
        message: 'Route ID and buses array are required',
      });
    }

    if (!mongoose.Types.ObjectId.isValid(routeId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid routeId format',
      });
    }

    for (const bus of buses) {
      if (
        !bus.bus ||
        !mongoose.Types.ObjectId.isValid(bus.bus) ||
        !bus.schedule ||
        !mongoose.Types.ObjectId.isValid(bus.schedule)
      ) {
        return res.status(400).json({
          success: false,
          message: 'Each bus must include valid bus and schedule IDs',
        });
      }
    }

    const route = await Route.findById(routeId);

    if (!route || route.status === 'Discontinued') {
      return res.status(404).json({
        success: false,
        message: 'Route not found or is discontinued',
      });
    }

    for (const bus of buses) {
      const isScheduleAlreadyAssigned = route.assignedBuses.some(
        (assignedBus) => assignedBus.schedule.toString() === bus.schedule
      );

      if (isScheduleAlreadyAssigned) {
        return res.status(400).json({
          success: false,
          message: `Schedule ${bus.schedule} is already assigned to another bus on this route`,
        });
      }
    }

    buses.forEach((bus) => {
      const isBusAlreadyAssigned = route.assignedBuses.some((assignedBus) => assignedBus.bus.toString() === bus.bus);

      if (!isBusAlreadyAssigned) {
        route.assignedBuses.push({
          bus: bus.bus,
          schedule: bus.schedule,
          isActive: bus.isActive !== undefined ? bus.isActive : true,
        });
      }
    });

    await route.save();

    res.status(200).json({
      success: true,
      message: 'Buses assigned to route successfully',
      assignedBuses: route.assignedBuses,
    });
  } catch (error) {
    console.error('Assign buses error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to assign buses to route',
      error: error.message,
    });
  }
};

module.exports = {
  createRoute,
  getAllRoutes,
  getRouteById,
  updateRoute,
  deleteRoute,
  calculateFare,
  assignBusesToRoute,
};
