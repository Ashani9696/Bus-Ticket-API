const mongoose = require('mongoose');

const stopSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Stop name is required'],
  },
  location: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point',
    },
    coordinates: {
      type: [Number],
      required: [true, 'Coordinates are required'],
      validate: {
        validator: function (v) {
          return v.length === 2 && v[0] >= -180 && v[0] <= 180 && v[1] >= -90 && v[1] <= 90;
        },
        message: 'Invalid coordinates. Must be [longitude, latitude]',
      },
    },
  },
  distanceFromStart: {
    type: Number,
    required: [true, 'Distance from start is required'],
  },
  estimatedTime: {
    type: Number,
    required: [true, 'Estimated time is required'],
  },
});

const scheduleSchema = new mongoose.Schema({
  departureTime: {
    type: String,
    required: [true, 'Departure time is required'],
    validate: {
      validator: function (v) {
        return /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(v);
      },
      message: 'Time must be in HH:MM format',
    },
  },
  operatingDays: [
    {
      type: String,
      enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
      required: [true, 'Operating days are required'],
    },
  ],
  isActive: {
    type: Boolean,
    default: true,
  },
  seasonalOperation: {
    isScheduled: { type: Boolean, default: false },
    startDate: Date,
    endDate: Date,
  },
});

const fareSchema = new mongoose.Schema({
  fromStop: {
    type: String,
    required: [true, 'Starting stop is required'],
  },
  toStop: {
    type: String,
    required: [true, 'Destination stop is required'],
  },
  amount: {
    type: Number,
    required: [true, 'Fare amount is required'],
    min: [0, 'Fare cannot be negative'],
  },
});

const routeSchema = new mongoose.Schema(
  {
    routeNumber: {
      type: String,
      required: [true, 'Route number is required'],
      unique: true,
      trim: true,
    },
    name: {
      type: String,
      required: [true, 'Route name is required'],
      trim: true,
    },
    category: {
      type: String,
      enum: ['Express', 'Local', 'Night', 'School', 'Special'],
      required: [true, 'Route category is required'],
    },
    stops: [stopSchema],
    schedules: [scheduleSchema],
    fares: [fareSchema],
    distance: {
      type: Number,
      required: [true, 'Total route distance is required'],
    },
    estimatedDuration: {
      type: Number,
      required: [true, 'Estimated duration is required'],
    },
    assignedBuses: [
      {
        bus: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Bus',
        },
        schedule: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Schedule',
        },
        isActive: {
          type: Boolean,
          default: true,
        },
      },
    ],
    status: {
      type: String,
      enum: ['Active', 'Suspended', 'Discontinued'],
      default: 'Active',
    },
    restrictions: {
      maxCapacity: {
        type: Number,
        required: true,
      },
      allowStanding: {
        type: Boolean,
        default: true,
      },
      accessibility: {
        wheelchairAccessible: { type: Boolean, default: false },
        lowFloor: { type: Boolean, default: false },
      },
    },
    features: {
      hasWifi: { type: Boolean, default: false },
      hasAC: { type: Boolean, default: false },
      hasUSBCharging: { type: Boolean, default: false },
    },
    metadata: {
      lastUpdated: { type: Date, default: Date.now },
      updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      version: { type: Number, default: 1 },
    },
  },
  {
    timestamps: true,
  }
);

routeSchema.index({ routeNumber: 1 });
routeSchema.index({ 'stops.location': '2dsphere' });
routeSchema.index({ status: 1 });
routeSchema.index({ category: 1 });

routeSchema.virtual('currentBusLocations').get(function () {
  return this.assignedBuses.map((bus) => ({
    busId: bus.bus,
  }));
});

routeSchema.methods.getStopsBetween = function (startStop, endStop) {
  const startIndex = this.stops.findIndex((stop) => stop.name === startStop);
  const endIndex = this.stops.findIndex((stop) => stop.name === endStop);

  if (startIndex === -1 || endIndex === -1) return [];

  return this.stops.slice(Math.min(startIndex, endIndex), Math.max(startIndex, endIndex) + 1);
};

routeSchema.methods.calculateFare = function (startStop, endStop) {
  const fare = this.fares.find((f) => f.fromStop === startStop && f.toStop === endStop);
  return fare ? fare.amount : null;
};

module.exports = mongoose.model('Route', routeSchema);
