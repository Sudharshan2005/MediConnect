const Medicine = require('../models/Medicine');

// @desc    Get all medicines
// @route   GET /api/v1/medicines
// @access  Public
exports.getMedicines = async (req, res, next) => {
  try {
    let query;

    // Copy req.query
    const reqQuery = { ...req.query };

    // Fields to exclude
    const removeFields = ['select', 'sort', 'page', 'limit'];

    // Loop over removeFields and delete them from reqQuery
    removeFields.forEach(param => delete reqQuery[param]);

    // Create query string
    let queryStr = JSON.stringify(reqQuery);

    // Create operators ($gt, $gte, etc)
    queryStr = queryStr.replace(/\b(gt|gte|lt|lte|in)\b/g, match => `$${match}`);

    // Finding resource
    query = Medicine.find(JSON.parse(queryStr));

    // Select Fields
    if (req.query.select) {
      const fields = req.query.select.split(',').join(' ');
      query = query.select(fields);
    }

    // Sort
    if (req.query.sort) {
      const sortBy = req.query.sort.split(',').join(' ');
      query = query.sort(sortBy);
    } else {
      query = query.sort('name');
    }

    // Pagination
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;
    const total = await Medicine.countDocuments();

    query = query.skip(startIndex).limit(limit);

    // Executing query
    const medicines = await query;

    // Pagination result
    const pagination = {};

    if (endIndex < total) {
      pagination.next = {
        page: page + 1,
        limit
      };
    }

    if (startIndex > 0) {
      pagination.prev = {
        page: page - 1,
        limit
      };
    }

    res.status(200).json({
      success: true,
      count: medicines.length,
      pagination,
      data: medicines
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      error: err.message
    });
  }
};

// @desc    Get single medicine
// @route   GET /api/v1/medicines/:id
// @access  Public
exports.getMedicine = async (req, res, next) => {
  try {
    const medicine = await Medicine.findById(req.params.id);

    if (!medicine) {
      return res.status(404).json({
        success: false,
        error: 'Medicine not found'
      });
    }

    res.status(200).json({
      success: true,
      data: medicine
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      error: err.message
    });
  }
};

// @desc    Create medicine
// @route   POST /api/v1/medicines
// @access  Private/Admin/Pharmacist
exports.createMedicine = async (req, res, next) => {
  try {
    const medicine = await Medicine.create(req.body);

    res.status(201).json({
      success: true,
      data: medicine
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      error: err.message
    });
  }
};

// @desc    Update medicine
// @route   PUT /api/v1/medicines/:id
// @access  Private/Admin/Pharmacist
exports.updateMedicine = async (req, res, next) => {
  try {
    let medicine = await Medicine.findById(req.params.id);

    if (!medicine) {
      return res.status(404).json({
        success: false,
        error: 'Medicine not found'
      });
    }

    medicine = await Medicine.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    res.status(200).json({
      success: true,
      data: medicine
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      error: err.message
    });
  }
};

// @desc    Delete medicine
// @route   DELETE /api/v1/medicines/:id
// @access  Private/Admin
exports.deleteMedicine = async (req, res, next) => {
  try {
    const medicine = await Medicine.findById(req.params.id);

    if (!medicine) {
      return res.status(404).json({
        success: false,
        error: 'Medicine not found'
      });
    }

    await medicine.remove();

    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      error: err.message
    });
  }
};

// @desc    Search medicines
// @route   GET /api/v1/medicines/search
// @access  Public
exports.searchMedicines = async (req, res, next) => {
  try {
    const { name, category, manufacturer } = req.query;
    let query = {};

    if (name) {
      query.name = { $regex: name, $options: 'i' };
    }

    if (category) {
      query.category = { $regex: category, $options: 'i' };
    }

    if (manufacturer) {
      query.manufacturer = { $regex: manufacturer, $options: 'i' };
    }

    const medicines = await Medicine.find(query)
      .sort('name')
      .limit(50);

    res.status(200).json({
      success: true,
      count: medicines.length,
      data: medicines
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      error: err.message
    });
  }
};

// @desc    Get medicines by category
// @route   GET /api/v1/medicines/category/:category
// @access  Public
exports.getMedicineByCategory = async (req, res, next) => {
  try {
    const medicines = await Medicine.find({
      category: { $regex: req.params.category, $options: 'i' }
    });

    res.status(200).json({
      success: true,
      count: medicines.length,
      data: medicines
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      error: err.message
    });
  }
};

// @desc    Update medicine stock
// @route   PUT /api/v1/medicines/:id/stock
// @access  Private/Admin/Pharmacist
exports.updateStock = async (req, res, next) => {
  try {
    const { quantity, action } = req.body;
    let medicine = await Medicine.findById(req.params.id);

    if (!medicine) {
      return res.status(404).json({
        success: false,
        error: 'Medicine not found'
      });
    }

    if (action === 'add') {
      medicine.stock += quantity;
    } else if (action === 'subtract') {
      if (medicine.stock < quantity) {
        return res.status(400).json({
          success: false,
          error: 'Insufficient stock'
        });
      }
      medicine.stock -= quantity;
    } else if (action === 'set') {
      medicine.stock = quantity;
    }

    await medicine.save();

    res.status(200).json({
      success: true,
      data: medicine
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      error: err.message
    });
  }
};

// @desc    Get low stock medicines
// @route   GET /api/v1/medicines/low-stock
// @access  Private/Admin/Pharmacist
exports.getLowStockMedicines = async (req, res, next) => {
  try {
    const threshold = req.query.threshold || 10;
    const medicines = await Medicine.find({
      stock: { $lt: threshold }
    }).sort('stock');

    res.status(200).json({
      success: true,
      count: medicines.length,
      data: medicines
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      error: err.message
    });
  }
};

// @desc    Get expiring medicines
// @route   GET /api/v1/medicines/expiring
// @access  Private/Admin/Pharmacist
exports.getExpiringMedicines = async (req, res, next) => {
  try {
    const days = req.query.days || 30;
    const date = new Date();
    date.setDate(date.getDate() + days);

    const medicines = await Medicine.find({
      expiryDate: { $lte: date, $gte: new Date() }
    }).sort('expiryDate');

    res.status(200).json({
      success: true,
      count: medicines.length,
      data: medicines
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      error: err.message
    });
  }
};