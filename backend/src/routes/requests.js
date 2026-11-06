const express = require('express');
const requestController = require('../controllers/requestController');
const { authenticate, requireRole, requireVerified } = require('../middleware/auth');

const router = express.Router();

router.use(authenticate);

router.post(
  '/',
  requireRole('recipient'),
  requireVerified,
  requestController.createRequest
);

router.get('/sent', requireRole('recipient'), requestController.getSentRequests);
router.get('/received', requireRole('donor'), requestController.getReceivedRequests);
router.get('/:id', requestController.getRequestById);
router.patch('/:id/status', requireRole('donor'), requestController.updateRequestStatus);
router.patch('/:id/handover', requestController.updateHandover);

module.exports = router;
