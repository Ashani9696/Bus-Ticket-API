const mongoose = require('mongoose');

const seatDetailSchema = new mongoose.Schema({
  id: { type: String, required: true },
  isBlocked: { type: Boolean, default: false },
  isAisle: { type: Boolean, default: false },
  type: {
    type: String,
    enum: ['window', 'middle', 'aisle'],
    required: true,
  },
});

const busSchema = new mongoose.Schema(
  {
    registrationNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    model: {
      type: String,
      required: true,
      trim: true,
    },
    manufacturer: {
      type: String,
      required: true,
    },
    capacity: {
      seating: { type: Number, required: true },
      standing: { type: Number, default: 0 },
    },
    features: {
      hasAC: { type: Boolean, default: false },
      hasWifi: { type: Boolean, default: false },
      hasUSBCharging: { type: Boolean, default: false },
      hasEntertainmentSystem: { type: Boolean, default: false },
    },
    maintenance: {
      lastMaintenanceDate: Date,
      nextMaintenanceDate: Date,
      status: {
        type: String,
        enum: ['operational', 'maintenance', 'repair'],
        default: 'operational',
      },
    },
    seatMatrix: {
      type: Map,
      of: {
        type: Map,
        of: seatDetailSchema,
      },
      default: () => new Map(),
    },
    currentRoute: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Route',
    },
    status: {
      type: String,
      enum: ['active', 'maintenance', 'retired'],
      default: 'active',
    },
  },
  {
    timestamps: true,
  }
);

busSchema.methods.setSeatMatrix = function (rows, columnLayouts) {
  const matrix = new Map();

  for (let row = 1; row <= rows; row++) {
    let rowColumns;

    if (columnLayouts[row - 1]) {
      rowColumns = columnLayouts[row - 1];
    } else {
      rowColumns = columnLayouts.default || ['A', 'B', 'C', 'D', 'E'];
    }

    const rowMap = new Map();
    rowColumns.forEach((column) => {
      rowMap.set(column, {
        id: `${row}${column}`,
        isBlocked: false,
        isAisle: ['C', 'D', 'E'].includes(column),
        type: column === rowColumns[0] || column === rowColumns[rowColumns.length - 1] ? 'window' : 'aisle',
      });
    });

    matrix.set(row.toString(), rowMap);
  }

  this.seatMatrix = matrix;
  return this.save();
};

busSchema.methods.getSeatMatrix = function () {
  const matrix = [];
  this.seatMatrix.forEach((row, rowNum) => {
    const rowArray = [];
    row.forEach((seat, seatLetter) => {
      rowArray.push({
        ...seat.toObject(),
        position: `${rowNum}${seatLetter}`,
      });
    });
    matrix.push(rowArray);
  });
  return matrix;
};

busSchema.index({ registrationNumber: 1 });
busSchema.index({ status: 1 });
busSchema.index({ 'maintenance.status': 1 });

module.exports = mongoose.model('Bus', busSchema);
