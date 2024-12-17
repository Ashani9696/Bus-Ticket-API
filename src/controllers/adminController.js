const User = require('../models/userModel');
const Route = require('../models/routeModel');
const Bus = require('../models/busModel');


const createRoute = async (req, res) => {
    const { name, startPoint, endPoint, schedule } = req.body;
    try {
      const newRoute = new Route({ name, startPoint, endPoint, schedule });
      await newRoute.save();
      res.status(201).json({ message: 'Route created successfully', newRoute });
    } catch (error) {
      res.status(400).json({ message: 'Error creating route', error });
    }
  };
  
  const updateRoute = async (req, res) => {
    const { routeId } = req.params;
    const updateData = req.body;
    try {
      const updatedRoute = await Route.findByIdAndUpdate(routeId, updateData, {
        new: true,
      });
      if (!updatedRoute) {
        return res.status(404).json({ message: 'Route not found' });
      }
      res.status(200).json(updatedRoute);
    } catch (error) {
      res.status(400).json({ message: 'Error updating route', error });
    }
  };
  
  const deleteRoute = async (req, res) => {
    const { routeId } = req.params;
    try {
      const deletedRoute = await Route.findByIdAndDelete(routeId);
      if (!deletedRoute) {
        return res.status(404).json({ message: 'Route not found' });
      }
      res.status(200).json({ message: 'Route deleted successfully' });
    } catch (error) {
      res.status(400).json({ message: 'Error deleting route', error });
    }
  };
  
  const viewAllRoutes = async (req, res) => {
    try {
      const routes = await Route.find().populate('buses');
      res.status(200).json({ success: true, data: routes });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error fetching routes',
        error: error.message,
      });
    }
  };
  
  const viewRouteById = async (req, res) => {
    const { routeId } = req.params;
    try {
      const route = await Route.findById(routeId).populate('buses');
      if (!route) {
        return res.status(404).json({ success: false, message: 'Route not found' });
      }
      res.status(200).json({ success: true, data: route });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error fetching route',
        error: error.message,
      });
    }
  };
  

const createUser = async (req, res) => {
  const { name, email, password, role } = req.body;
  try {
    const newUser = new User({ name, email, password, role });
    await newUser.save();
    res.status(201).json({ message: 'User created successfully', newUser });
  } catch (error) {
    res.status(400).json({ message: 'Error creating user', error });
  }
};

const updateUser = async (req, res) => {
  const { userId } = req.params;
  const updateData = req.body;
  try {
    const updatedUser = await User.findByIdAndUpdate(userId, updateData, {
      new: true,
    });
    if (!updatedUser) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.status(200).json(updatedUser);
  } catch (error) {
    res.status(400).json({ message: 'Error updating user', error });
  }
};

const deleteUser = async (req, res) => {
  const { userId } = req.params;
  try {
    const deletedUser = await User.findByIdAndDelete(userId);
    if (!deletedUser) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.status(200).json({ message: 'User deleted successfully' });
  } catch (error) {
    res.status(400).json({ message: 'Error deleting user', error });
  }
};

const viewAllUsers = async (req, res) => {
  try {
    const users = await User.find({ _id: { $ne: req.user.id } });
    res.status(200).json({ success: true, data: users });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching users',
      error: error.message,
    });
  }
};

const viewUserById = async (req, res) => {
  const { userId } = req.params;
  try {
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    res.status(200).json({ success: true, data: user });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching user',
      error: error.message,
    });
  }
};

module.exports = {
  createUser,
  updateUser,
  deleteUser,
  viewAllUsers,
  viewUserById,
  viewRouteById,
  createRoute,
  updateRoute,
  deleteRoute,
  viewAllRoutes
};
