const Permit = require('../models/permitModel');
const ErrorHandler = require('../utils/errorHandler');

const verifyPermitAccess = async (permitId, userId, role) => {
  const permit = await Permit.findById(permitId);
  if (!permit) {
    throw new ErrorHandler(404, 'Permit not found');
  }
  if (role !== 'admin' && permit.operator.toString() !== userId) {
    throw new ErrorHandler(403, 'You do not have permission to access this permit');
  }
  return permit;
};

const createPermit = async (req, res) => {
  try {
    const { permitNumber, issueDate, expiryDate, route, bus, operator, status } = req.body;

    const newPermit = new Permit({
      permitNumber,
      issueDate,
      expiryDate,
      route,
      bus,
      operator,
      status,
      createdBy: req.user._id,
    });

    const savedPermit = await newPermit.save();

    const populatedPermit = await Permit.findById(savedPermit._id)
      .populate('route', 'name routeNumber')
      .populate('bus', 'registrationNumber')
      .populate('operator', 'name email');

    res.status(201).json({
      success: true,
      message: 'Permit created successfully',
      permit: populatedPermit,
    });
  } catch (error) {
    console.error('Create permit error:', error);
    res.status(400).json({
      success: false,
      message: 'Failed to create permit',
      error: error.message,
    });
  }
};

const getAllPermits = async (req, res) => {
  try {
    const { page = 1, limit = 10, status, operator, route, startDate, endDate, sort = '-createdAt' } = req.query;

    const filter = {};
    if (status) filter.status = status;
    if (operator) filter.operator = operator;
    if (route) filter.route = route;
    if (startDate || endDate) {
      filter.issueDate = {};
      if (startDate) filter.issueDate.$gte = new Date(startDate);
      if (endDate) filter.issueDate.$lte = new Date(endDate);
    }

    if (req.user.role !== 'admin') {
      filter.operator = req.user._id;
    }

    const permits = await Permit.find(filter)
      .populate('route', 'name routeNumber')
      .populate('bus', 'registrationNumber')
      .populate('operator', 'name email')
      .sort(sort)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .exec();

    const total = await Permit.countDocuments(filter);

    res.status(200).json({
      success: true,
      permits,
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      totalPermits: total,
    });
  } catch (error) {
    console.error('Get permits error:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving permits',
      error: error.message,
    });
  }
};

const getPermitById = async (req, res) => {
  try {
    const permit = await verifyPermitAccess(req.params.id, req.user._id, req.user.role);

    const populatedPermit = await Permit.findById(permit._id)
      .populate('route', 'name routeNumber')
      .populate('bus', 'registrationNumber')
      .populate('operator', 'name email')
      .populate('createdBy', 'name');

    res.status(200).json({
      success: true,
      permit: populatedPermit,
    });
  } catch (error) {
    console.error('Get permit error:', error);
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Error retrieving permit',
      error: error.message,
    });
  }
};

const updatePermit = async (req, res) => {
  try {
    const permit = await verifyPermitAccess(req.params.id, req.user._id, req.user.role);

    const updates = {
      ...req.body,
      lastUpdatedBy: req.user._id,
      lastUpdatedAt: Date.now(),
    };

    if (updates.status === 'expired' && permit.status !== 'expired') {
      updates.expiryDate = new Date();
    }

    const updatedPermit = await Permit.findByIdAndUpdate(
      req.params.id,
      { $set: updates },
      { new: true, runValidators: true }
    )
      .populate('route', 'name routeNumber')
      .populate('bus', 'registrationNumber')
      .populate('operator', 'name email');

    res.status(200).json({
      success: true,
      message: 'Permit updated successfully',
      permit: updatedPermit,
    });
  } catch (error) {
    console.error('Update permit error:', error);
    res.status(error.statusCode || 400).json({
      success: false,
      message: 'Failed to update permit',
      error: error.message,
    });
  }
};

const deletePermit = async (req, res) => {
  try {
    const permit = await verifyPermitAccess(req.params.id, req.user._id, req.user.role);

    await Permit.findByIdAndUpdate(req.params.id, {
      status: 'suspended',
      isDeleted: true,
      deletedAt: new Date(),
      deletedBy: req.user._id,
    });

    res.status(200).json({
      success: true,
      message: 'Permit deleted successfully',
    });
  } catch (error) {
    console.error('Delete permit error:', error);
    res.status(error.statusCode || 500).json({
      success: false,
      message: 'Failed to delete permit',
      error: error.message,
    });
  }
};

const getPermitStats = async (req, res) => {
  try {
    const stats = await Permit.aggregate([
      {
        $match: req.user.role !== 'admin' ? { operator: req.user._id } : {},
      },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          routes: { $addToSet: '$route' },
          buses: { $addToSet: '$bus' },
        },
      },
    ]);

    const totalStats = {
      total: stats.reduce((acc, curr) => acc + curr.count, 0),
      byStatus: stats.reduce(
        (acc, curr) => ({
          ...acc,
          [curr._id]: {
            count: curr.count,
            uniqueRoutes: curr.routes.length,
            uniqueBuses: curr.buses.length,
          },
        }),
        {}
      ),
    };

    res.status(200).json({
      success: true,
      statistics: totalStats,
    });
  } catch (error) {
    console.error('Get permit stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving permit statistics',
      error: error.message,
    });
  }
};

const checkPermitValidity = async (req, res) => {
  try {
    const { permitNumber } = req.params;

    const permit = await Permit.findOne({ permitNumber })
      .populate('route', 'name routeNumber')
      .populate('bus', 'registrationNumber')
      .select('-createdBy -lastUpdatedBy');

    if (!permit) {
      return res.status(404).json({
        success: false,
        message: 'Permit not found',
      });
    }

    const isValid = permit.status === 'active' && permit.expiryDate > new Date() && !permit.isDeleted;

    res.status(200).json({
      success: true,
      isValid,
      permit: isValid ? permit : null,
      message: isValid ? 'Permit is valid' : 'Permit is not valid',
    });
  } catch (error) {
    console.error('Check permit validity error:', error);
    res.status(500).json({
      success: false,
      message: 'Error checking permit validity',
      error: error.message,
    });
  }
};

module.exports = {
  createPermit,
  getAllPermits,
  getPermitById,
  updatePermit,
  deletePermit,
  getPermitStats,
  checkPermitValidity,
};
