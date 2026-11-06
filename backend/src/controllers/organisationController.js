const Organisation = require('../models/Organisation');

const getMyOrganisation = async (req, res, next) => {
  try {
    if (!req.user.organisationId) {
      return res.status(404).json({
        error: 'NotFound',
        message: 'No organisation associated with this user',
        statusCode: 404,
      });
    }

    const organisation = await Organisation.findById(req.user.organisationId);
    if (!organisation) {
      return res.status(404).json({
        error: 'NotFound',
        message: 'Organisation not found',
        statusCode: 404,
      });
    }

    return res.status(200).json({
      organisation,
    });
  } catch (error) {
    next(error);
  }
};

const updateMyOrganisation = async (req, res, next) => {
  try {
    if (!req.user.organisationId) {
      return res.status(404).json({
        error: 'NotFound',
        message: 'No organisation associated with this user',
        statusCode: 404,
      });
    }

    const organisation = await Organisation.findById(req.user.organisationId);
    if (!organisation) {
      return res.status(404).json({
        error: 'NotFound',
        message: 'Organisation not found',
        statusCode: 404,
      });
    }

    const { name, type, email, phone, address } = req.body;

    if (name !== undefined) organisation.name = name;
    if (type !== undefined) organisation.type = type;
    if (email !== undefined) organisation.email = email;
    if (phone !== undefined) organisation.phone = phone;
    if (address !== undefined) {
      organisation.address = {
        ...organisation.address?.toObject(),
        ...address,
      };
    }

    await organisation.save();

    return res.status(200).json({
      message: 'Organisation updated successfully',
      organisation,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getMyOrganisation,
  updateMyOrganisation,
};
