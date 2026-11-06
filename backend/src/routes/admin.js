const express = require('express');
const adminController = require('../controllers/adminController');
const { authenticate, requireRole } = require('../middleware/auth');

const router = express.Router();

router.use(authenticate, requireRole('admin'));

router.get('/organisations', adminController.getOrganisations);
router.patch('/organisations/:id/verification', adminController.updateVerification);
router.get('/stats', adminController.getStats);

module.exports = router;
