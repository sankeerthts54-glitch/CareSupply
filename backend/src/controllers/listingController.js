const Listing = require('../models/Listing');
const Request = require('../models/Request');

const getListings = async (req, res, next) => {
  try {
    const { category, city, search, sort } = req.query;

    // Automatically update expired listings
    await Listing.updateMany(
      {
        expiryDate: { $ne: null, $lt: new Date() },
        status: { $nin: ['expired', 'withdrawn', 'completed'] },
      },
      { status: 'expired' }
    );

    const query = {
      status: { $nin: ['expired', 'withdrawn'] },
    };

    if (category) {
      query.category = category;
    }

    if (city) {
      query['pickupLocation.city'] = { $regex: new RegExp(city.trim(), 'i') };
    }

    if (search) {
      const searchRegex = new RegExp(search.trim(), 'i');
      query.$or = [{ title: searchRegex }, { description: searchRegex }];
    }

    let sortOption = { createdAt: -1 };
    if (sort === 'nearestExpiry') {
      // Sort items with expiry date ascending, items without expiry date at the end
      sortOption = { expiryDate: 1 };
      query.expiryDate = { $ne: null };
    } else if (sort === 'quantity') {
      sortOption = { availableQuantity: -1 };
    } else if (sort === 'newest') {
      sortOption = { createdAt: -1 };
    }

    const listings = await Listing.find(query)
      .populate('donorOrganisationId', 'name type email phone address verificationStatus')
      .populate('donorUserId', 'name email')
      .sort(sortOption);

    // Format output to include donorOrganisation alias for frontend convenience
    const formattedListings = listings.map((listing) => {
      const doc = listing.toObject();
      doc.donorOrganisation = doc.donorOrganisationId;
      return doc;
    });

    return res.status(200).json({
      count: formattedListings.length,
      listings: formattedListings,
    });
  } catch (error) {
    next(error);
  }
};

const getListingById = async (req, res, next) => {
  try {
    const listing = await Listing.findById(req.params.id)
      .populate('donorOrganisationId', 'name type email phone address verificationStatus')
      .populate('donorUserId', 'name email');

    if (!listing) {
      return res.status(404).json({
        error: 'NotFound',
        message: 'Listing not found',
        statusCode: 404,
      });
    }

    // Check expiry
    if (
      listing.expiryDate &&
      new Date(listing.expiryDate) < new Date() &&
      !['expired', 'withdrawn', 'completed'].includes(listing.status)
    ) {
      listing.status = 'expired';
      await listing.save();
    }

    const doc = listing.toObject();
    doc.donorOrganisation = doc.donorOrganisationId;

    return res.status(200).json({
      listing: doc,
    });
  } catch (error) {
    next(error);
  }
};

const createListing = async (req, res, next) => {
  try {
    const {
      title,
      description,
      category,
      quantity,
      unit,
      condition,
      expiryDate,
      pickupLocation,
      imageUrl,
      handoverInstructions,
    } = req.body;

    if (!title || !description || !category || !quantity || !unit || !condition) {
      return res.status(400).json({
        error: 'ValidationError',
        message: 'Title, description, category, quantity, unit, and condition are required',
        statusCode: 400,
      });
    }

    if (quantity < 1) {
      return res.status(400).json({
        error: 'ValidationError',
        message: 'Quantity must be at least 1',
        statusCode: 400,
      });
    }

    if (expiryDate) {
      const parsedExpiry = new Date(expiryDate);
      if (isNaN(parsedExpiry.getTime())) {
        return res.status(400).json({
          error: 'ValidationError',
          message: 'Invalid expiry date format',
          statusCode: 400,
        });
      }

      if (parsedExpiry <= new Date()) {
        return res.status(400).json({
          error: 'ValidationError',
          message: 'Expiry date must be in the future',
          statusCode: 400,
        });
      }
    }

    const listing = new Listing({
      title: title.trim(),
      description: description.trim(),
      category,
      quantity,
      availableQuantity: quantity,
      unit: unit.trim(),
      condition,
      expiryDate: expiryDate ? new Date(expiryDate) : null,
      pickupLocation: pickupLocation || {
        address: req.organisation?.address?.street || '',
        city: req.organisation?.address?.city || '',
        postcode: req.organisation?.address?.postcode || '',
      },
      imageUrl: imageUrl || null,
      handoverInstructions: handoverInstructions ? handoverInstructions.trim() : '',
      donorOrganisationId: req.user.organisationId,
      donorUserId: req.user._id,
      status: 'active',
    });

    await listing.save();

    const populatedListing = await Listing.findById(listing._id)
      .populate('donorOrganisationId', 'name type email phone address verificationStatus')
      .populate('donorUserId', 'name email');

    const doc = populatedListing.toObject();
    doc.donorOrganisation = doc.donorOrganisationId;

    return res.status(201).json({
      message: 'Listing created successfully',
      listing: doc,
    });
  } catch (error) {
    next(error);
  }
};

const updateListing = async (req, res, next) => {
  try {
    const listing = await Listing.findById(req.params.id);

    if (!listing) {
      return res.status(404).json({
        error: 'NotFound',
        message: 'Listing not found',
        statusCode: 404,
      });
    }

    // Owner check: donor user or donor organisation match, or admin
    const isOwnerUser = listing.donorUserId.toString() === req.user._id.toString();
    const isOwnerOrg =
      req.user.organisationId &&
      listing.donorOrganisationId.toString() === req.user.organisationId.toString();
    const isAdmin = req.user.role === 'admin';

    if (!isOwnerUser && !isOwnerOrg && !isAdmin) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'You are not authorized to update this listing',
        statusCode: 403,
      });
    }

    const {
      title,
      description,
      category,
      quantity,
      unit,
      condition,
      expiryDate,
      pickupLocation,
      imageUrl,
      handoverInstructions,
      status,
    } = req.body;

    if (expiryDate !== undefined) {
      if (expiryDate) {
        const parsedExpiry = new Date(expiryDate);
        if (isNaN(parsedExpiry.getTime())) {
          return res.status(400).json({
            error: 'ValidationError',
            message: 'Invalid expiry date format',
            statusCode: 400,
          });
        }
        listing.expiryDate = parsedExpiry;
      } else {
        listing.expiryDate = null;
      }
    }

    if (quantity !== undefined) {
      if (quantity < 1) {
        return res.status(400).json({
          error: 'ValidationError',
          message: 'Quantity must be at least 1',
          statusCode: 400,
        });
      }
      const reservedDiff = listing.quantity - listing.availableQuantity;
      if (quantity < reservedDiff) {
        return res.status(400).json({
          error: 'ValidationError',
          message: `Cannot decrease total quantity below currently allocated/requested quantity (${reservedDiff})`,
          statusCode: 400,
        });
      }
      listing.availableQuantity = quantity - reservedDiff;
      listing.quantity = quantity;
    }

    if (title !== undefined) listing.title = title.trim();
    if (description !== undefined) listing.description = description.trim();
    if (category !== undefined) listing.category = category;
    if (unit !== undefined) listing.unit = unit.trim();
    if (condition !== undefined) listing.condition = condition;
    if (imageUrl !== undefined) listing.imageUrl = imageUrl;
    if (handoverInstructions !== undefined) listing.handoverInstructions = handoverInstructions.trim();
    if (pickupLocation !== undefined) {
      listing.pickupLocation = {
        ...listing.pickupLocation?.toObject(),
        ...pickupLocation,
      };
    }
    if (status !== undefined) {
      listing.status = status;
    }

    await listing.save();

    const populatedListing = await Listing.findById(listing._id)
      .populate('donorOrganisationId', 'name type email phone address verificationStatus')
      .populate('donorUserId', 'name email');

    const doc = populatedListing.toObject();
    doc.donorOrganisation = doc.donorOrganisationId;

    return res.status(200).json({
      message: 'Listing updated successfully',
      listing: doc,
    });
  } catch (error) {
    next(error);
  }
};

const deleteListing = async (req, res, next) => {
  try {
    const listing = await Listing.findById(req.params.id);

    if (!listing) {
      return res.status(404).json({
        error: 'NotFound',
        message: 'Listing not found',
        statusCode: 404,
      });
    }

    // Owner check
    const isOwnerUser = listing.donorUserId.toString() === req.user._id.toString();
    const isOwnerOrg =
      req.user.organisationId &&
      listing.donorOrganisationId.toString() === req.user.organisationId.toString();
    const isAdmin = req.user.role === 'admin';

    if (!isOwnerUser && !isOwnerOrg && !isAdmin) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'You are not authorized to delete this listing',
        statusCode: 403,
      });
    }

    // Check if there are any approved requests
    const approvedRequests = await Request.find({
      listingId: listing._id,
      status: 'approved',
    });

    if (approvedRequests.length > 0) {
      return res.status(400).json({
        error: 'BadRequest',
        message: 'Cannot delete listing with approved requests in progress',
        statusCode: 400,
      });
    }

    await listing.deleteOne();

    return res.status(200).json({
      message: 'Listing deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getListings,
  getListingById,
  createListing,
  updateListing,
  deleteListing,
};
