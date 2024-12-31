const Bus = require('../models/busModel');
const Booking = require('../models/bookingModel');
const Route = require('../models/routeModel');

const validateSeatType = (type) => {
  const validTypes = ['window', 'middle', 'aisle'];
  return validTypes.includes(type);
};

const validateSeatMatrix = (rows, columnLayouts, seatTypes) => {
  if (!rows || !Array.isArray(columnLayouts)) {
    return { isValid: false, error: 'Invalid rows or columnLayouts format' };
  }

  if (columnLayouts.length > rows) {
    return { isValid: false, error: 'Number of rows in columnLayouts exceeds specified rows' };
  }

  for (const layout of columnLayouts) {
    if (!Array.isArray(layout)) {
      return { isValid: false, error: 'Invalid column layout format' };
    }

    if (!layout.every((col) => /^[A-Z]$/.test(col))) {
      return { isValid: false, error: 'Invalid column identifier. Must be A-Z' };
    }
  }

  if (seatTypes) {
    for (const row in seatTypes) {
      if (!columnLayouts[row - 1]) {
        return { isValid: false, error: `Invalid row ${row} in seatTypes` };
      }

      for (const col in seatTypes[row]) {
        if (!columnLayouts[row - 1].includes(col)) {
          return { isValid: false, error: `Invalid column ${col} in row ${row}` };
        }

        const seatType = seatTypes[row][col];
        if (!validateSeatType(seatType.type)) {
          return { isValid: false, error: `Invalid seat type for position ${row}${col}` };
        }
      }
    }
  }

  return { isValid: true };
};

const createSeatMatrix = async (req, res) => {
  try {
    const { id } = req.params;
    const { rows, columnLayouts, seatTypes } = req.body;

    const validation = validateSeatMatrix(rows, columnLayouts, seatTypes);
    if (!validation.isValid) {
      return res.status(400).json({
        success: false,
        message: validation.error,
      });
    }

    const bus = await Bus.findById(id);
    if (!bus) {
      return res.status(404).json({
        success: false,
        message: 'Bus not found',
      });
    }

    if (bus.seatMatrix.size > 0) {
      return res.status(400).json({
        success: false,
        message: 'Seat matrix already exists. Use update endpoint to modify.',
      });
    }

    await bus.setSeatMatrix(rows, columnLayouts);

    if (seatTypes) {
      const seatMatrix = bus.seatMatrix;
      for (const row in seatTypes) {
        const rowMap = seatMatrix.get(row);
        if (rowMap) {
          for (const col in seatTypes[row]) {
            if (rowMap.has(col)) {
              const seatTypeData = seatTypes[row][col];
              rowMap.set(col, {
                id: `${row}${col}`,
                isBlocked: seatTypeData.isBlocked ?? false,
                isAisle: seatTypeData.isAisle ?? false,
                type: seatTypeData.type,
              });
            }
          }
        }
      }
      bus.markModified('seatMatrix');
    }

    await bus.save();
    const newSeatMatrix = bus.getSeatMatrix();

    res.status(201).json({
      success: true,
      data: newSeatMatrix,
      message: 'Seat matrix created successfully',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const getAllSeats = async (req, res) => {
  try {
    const { id } = req.params;
    const bus = await Bus.findById(id);

    if (!bus) {
      return res.status(404).json({
        success: false,
        message: 'Bus not found',
      });
    }

    const seatMatrix = bus.getSeatMatrix();

    const stats = {
      totalSeats: 0,
      blockedSeats: 0,
      aisleSeats: 0,
      seatTypes: {
        window: 0,
        middle: 0,
        aisle: 0,
      },
    };

    seatMatrix.forEach((row) => {
      row.forEach((seat) => {
        stats.totalSeats++;
        if (seat.isBlocked) stats.blockedSeats++;
        if (seat.isAisle) stats.aisleSeats++;
        stats.seatTypes[seat.type]++;
      });
    });

    res.json({
      success: true,
      data: {
        matrix: seatMatrix,
        stats,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const getAllSeatsWithDate = async (req, res) => {
  try {
    const { id } = req.params;
    const { date } = req.query;

    if (!date) {
      return res.status(400).json({
        success: false,
        message: 'Date parameter is required',
      });
    }

    const bus = await Bus.findById(id);
    if (!bus) {
      return res.status(404).json({
        success: false,
        message: 'Bus not found',
      });
    }

    const seatMatrix = bus.getSeatMatrix();

    const bookings = await Booking.find({
      routeId: id,
      date: {
        $gte: new Date(new Date(date).setHours(0, 0, 0)),
        $lt: new Date(new Date(date).setHours(23, 59, 59)),
      },
      status: { $ne: 'cancelled' },
    });

    const bookedSeats = new Map();
    bookings.forEach((booking) => {
      booking.seats.forEach((seat) => {
        bookedSeats.set(seat.seatId, true);
      });
    });

    const updatedSeatMatrix = seatMatrix.map((row) => {
      return row.map((seat) => {
        return {
          ...seat,
          isBlocked: seat.isBlocked || bookedSeats.has(seat._id),
        };
      });
    });

    const stats = {
      totalSeats: 0,
      blockedSeats: 0,
      aisleSeats: 0,
      bookedSeats: bookedSeats.size,
      seatTypes: {
        window: 0,
        middle: 0,
        aisle: 0,
      },
    };

    updatedSeatMatrix.forEach((row) => {
      row.forEach((seat) => {
        stats.totalSeats++;
        if (seat.isBlocked) stats.blockedSeats++;
        if (seat.isAisle) stats.aisleSeats++;
        stats.seatTypes[seat.type]++;
      });
    });

    res.json({
      success: true,
      data: {
        matrix: updatedSeatMatrix,
        stats,
        date: date,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const getSeat = async (req, res) => {
  try {
    const { id, row, column } = req.params;

    const bus = await Bus.findById(id);
    if (!bus) {
      return res.status(404).json({
        success: false,
        message: 'Bus not found',
      });
    }

    const rowMap = bus.seatMatrix.get(row);
    if (!rowMap || !rowMap.has(column)) {
      return res.status(404).json({
        success: false,
        message: 'Seat not found',
      });
    }

    const seat = rowMap.get(column);

    res.json({
      success: true,
      data: {
        position: `${row}${column}`,
        ...seat.toObject(),
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const updateSeatMatrix = async (req, res) => {
  try {
    const { id } = req.params;
    const { rows, columnLayouts, seatTypes } = req.body;

    const validation = validateSeatMatrix(rows, columnLayouts, seatTypes);
    if (!validation.isValid) {
      return res.status(400).json({
        success: false,
        message: validation.error,
      });
    }

    const bus = await Bus.findById(id);
    if (!bus) {
      return res.status(404).json({
        success: false,
        message: 'Bus not found',
      });
    }

    await bus.setSeatMatrix(rows, columnLayouts);

    if (seatTypes) {
      const seatMatrix = bus.seatMatrix;
      for (const row in seatTypes) {
        const rowMap = seatMatrix.get(row);
        if (rowMap) {
          for (const col in seatTypes[row]) {
            if (rowMap.has(col)) {
              const seatTypeData = seatTypes[row][col];
              rowMap.set(col, {
                id: `${row}${col}`,
                isBlocked: seatTypeData.isBlocked ?? false,
                isAisle: seatTypeData.isAisle ?? false,
                type: seatTypeData.type,
              });
            }
          }
        }
      }
      bus.markModified('seatMatrix');
    }

    await bus.save();
    const updatedSeatMatrix = bus.getSeatMatrix();

    res.json({
      success: true,
      data: updatedSeatMatrix,
      message: 'Seat matrix updated successfully',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const updateSeat = async (req, res) => {
  try {
    const { id, row, column } = req.params;
    const { isBlocked, isAisle, type } = req.body;

    if (type && !validateSeatType(type)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid seat type. Must be one of: window, middle, aisle',
      });
    }

    const bus = await Bus.findById(id);
    if (!bus) {
      return res.status(404).json({
        success: false,
        message: 'Bus not found',
      });
    }

    const rowMap = bus.seatMatrix.get(row);
    if (!rowMap || !rowMap.has(column)) {
      return res.status(404).json({
        success: false,
        message: 'Seat not found',
      });
    }

    const currentSeat = rowMap.get(column);
    const updatedSeat = {
      ...currentSeat,
      isBlocked: isBlocked ?? currentSeat.isBlocked,
      isAisle: isAisle ?? currentSeat.isAisle,
      type: type || currentSeat.type,
    };

    rowMap.set(column, updatedSeat);
    bus.markModified('seatMatrix');
    await bus.save();

    res.json({
      success: true,
      data: {
        position: `${row}${column}`,
        ...updatedSeat,
      },
      message: 'Seat updated successfully',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const deleteSeatMatrix = async (req, res) => {
  try {
    const { id } = req.params;

    const bus = await Bus.findById(id);
    if (!bus) {
      return res.status(404).json({
        success: false,
        message: 'Bus not found',
      });
    }

    bus.seatMatrix = new Map();
    bus.markModified('seatMatrix');
    await bus.save();

    res.json({
      success: true,
      message: 'Seat matrix deleted successfully',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  createSeatMatrix,
  getAllSeats,
  getSeat,
  updateSeatMatrix,
  updateSeat,
  deleteSeatMatrix,
  getAllSeatsWithDate,
};
