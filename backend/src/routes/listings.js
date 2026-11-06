const express = require('express');
const listingController = require('../controllers/listingController');
const { authenticate, requireRole, requireVerified } = require('../middleware/auth');

const router = express.Router();

// Public routes
router.get('/', listingController.getListings);
router.get('/:id', listingController.getListingById);

// Protected routes
router.post(
  '/',
  authenticate,
  requireRole('donor'),
  requireVerified,
  listingController.createListing
);

router.put('/:id', authenticate, listingController.updateListing);
router.delete('/:id', authenticate, listingController.deleteListing);

module.exports = router;
