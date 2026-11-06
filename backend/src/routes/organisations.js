const express = require('express');
const organisationController = require('../controllers/organisationController');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

router.use(authenticate);

router.get('/me', organisationController.getMyOrganisation);
router.put('/me', organisationController.updateMyOrganisation);

module.exports = router;
