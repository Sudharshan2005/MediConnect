const express = require('express');
const {
  getMedicines,
  getMedicine,
  createMedicine,
  updateMedicine,
  deleteMedicine,
  searchMedicines,
  getMedicineByCategory,
  updateStock,
  getLowStockMedicines,
  getExpiringMedicines
} = require('../controllers/medicines');

const router = express.Router();

const { protect, authorize } = require('../middleware/auth');

router.route('/')
  .get(getMedicines)
  .post(protect, authorize('admin', 'pharmacist'), createMedicine);

router.route('/search').get(searchMedicines);
router.route('/category/:category').get(getMedicineByCategory);
router.route('/low-stock').get(protect, authorize('admin', 'pharmacist'), getLowStockMedicines);
router.route('/expiring').get(protect, authorize('admin', 'pharmacist'), getExpiringMedicines);

router.route('/:id/stock')
  .put(protect, authorize('admin', 'pharmacist'), updateStock);

router.route('/:id')
  .get(getMedicine)
  .put(protect, authorize('admin', 'pharmacist'), updateMedicine)
  .delete(protect, authorize('admin'), deleteMedicine);

module.exports = router;