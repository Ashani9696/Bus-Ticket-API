const Permit = require('../models/permitModel');

// Create a new permit
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
    res.status(error.statusCode || 400).json({
      success: false,
      message: error.message || 'Failed to create permit',
    });
  }
};

const getAllPermits = async (req, res) => {
  try {
    const { page = 1, limit = 10, status, operator, route, startDate, endDate, sort = '-createdAt' } = req.query;

    // Build filter object with debug logging
    const filter = {};

    if (status) {
      filter.status = status;
    }

    if (operator) {
      filter.operator = operator;
    }

    if (route) {
      filter.route = route;
    }

    if (startDate || endDate) {
      filter.issueDate = {};
      if (startDate) {
        filter.issueDate.$gte = new Date(startDate);
      }
      if (endDate) {
        filter.issueDate.$lte = new Date(endDate);
      }
    }

    // Fixed role check for array of roles
    if (req.user && !req.user.role.includes('admin')) {
      filter.operator = req.user._id;
      console.log('Added operator filter for non-admin:', req.user._id);
    }

    // Perform initial raw find to check data
    const rawCount = await Permit.countDocuments({});

    // Execute main query with error handling
    const permits = await Permit.find(filter)
      .populate('route', 'name routeNumber')
      .populate('bus', 'registrationNumber')
      .populate('operator', 'name email')
      .sort(sort)
      .limit(parseInt(limit))
      .skip((page - 1) * parseInt(limit))
      .lean()
      .exec();

    console.log('Query results count:', permits.length);

    if (permits.length === 0) {
      const samplePermit = await Permit.findOne({}).lean();
    }

    const total = await Permit.countDocuments(filter);

    res.status(200).json({
      success: true,
      permits,
      currentPage: parseInt(page),
      totalPages: Math.ceil(total / parseInt(limit)),
      totalPermits: total,
    });
  } catch (error) {
    console.error('Get permits error:', error);
    console.error('Error stack:', error.stack);
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Error retrieving permits',
    });
  }
};

// Get a permit by ID
const getPermitById = async (req, res) => {
  try {
    const permit = await Permit.findById(req.params.id)
      .populate('route', 'name routeNumber')
      .populate('bus', 'registrationNumber')
      .populate('operator', 'name email')
      .populate('createdBy', 'name')
      .set('strictPopulate', false); // Allow population of fields not in the schema

    if (!permit) {
      return res.status(404).json({
        success: false,
        message: 'Permit not found',
      });
    }

    res.status(200).json({
      success: true,
      permit,
    });
  } catch (error) {
    console.error('Get permit error:', error);
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Error retrieving permit',
    });
  }
};

// Update a permit
const updatePermit = async (req, res) => {
  try {
    const updates = {
      ...req.body,
      lastUpdatedBy: req.user._id,
      lastUpdatedAt: Date.now(),
    };

    const permit = await Permit.findByIdAndUpdate(req.params.id, { $set: updates }, { new: true, runValidators: true })
      .populate('route', 'name routeNumber')
      .populate('bus', 'registrationNumber')
      .populate('operator', 'name email');

    if (!permit) {
      return res.status(404).json({
        success: false,
        message: 'Permit not found',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Permit updated successfully',
      permit,
    });
  } catch (error) {
    console.error('Update permit error:', error);
    res.status(error.statusCode || 400).json({
      success: false,
      message: error.message || 'Failed to update permit',
    });
  }
};

// Delete a permit (suspend it)
const deletePermit = async (req, res) => {
  try {
    const permit = await Permit.findByIdAndDelete(req.params.id);

    if (!permit) {
      return res.status(404).json({
        success: false,
        message: 'Permit not found',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Permit deleted successfully',
    });
  } catch (error) {
    console.error('Delete permit error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to delete permit',
    });
  }
};


const checkPermitValidity = async (req, res) => {
  try {
    const { permitNumber } = req.params;

    // Query by permitNumber instead of _id
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
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Error checking permit validity',
    });
  }
};

module.exports = {
  createPermit,
  getAllPermits,
  getPermitById,
  updatePermit,
  deletePermit,
  checkPermitValidity,
};
