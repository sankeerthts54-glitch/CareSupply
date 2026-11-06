const Listing = require('../models/Listing');
const Request = require('../models/Request');
const Notification = require('../models/Notification');
const Organisation = require('../models/Organisation');

const createRequest = async (req, res, next) => {
  try {
    const { listingId, requestedQuantity, message } = req.body;

    if (!listingId || !requestedQuantity) {
      return res.status(400).json({
        error: 'ValidationError',
        message: 'listingId and requestedQuantity are required',
        statusCode: 400,
      });
    }

    const qty = parseInt(requestedQuantity, 10);
    if (isNaN(qty) || qty < 1) {
      return res.status(400).json({
        error: 'ValidationError',
        message: 'Requested quantity must be at least 1',
        statusCode: 400,
      });
    }

    // Atomic find and update to prevent overselling
    const listing = await Listing.findOneAndUpdate(
      {
        _id: listingId,
        status: 'active',
        availableQuantity: { $gte: qty },
      },
      {
        $inc: { availableQuantity: -qty },
      },
      { new: true }
    );

    if (!listing) {
      // Check why it failed to provide a precise error message
      const existingListing = await Listing.findById(listingId);
      if (!existingListing) {
        return res.status(404).json({
          error: 'NotFound',
          message: 'Listing not found',
          statusCode: 404,
        });
      }

      if (existingListing.status !== 'active') {
        return res.status(400).json({
          error: 'BadRequest',
          message: `Listing is not active (current status: ${existingListing.status})`,
          statusCode: 400,
        });
      }

      return res.status(400).json({
        error: 'BadRequest',
        message: `Requested quantity (${qty}) exceeds available quantity (${existingListing.availableQuantity})`,
        statusCode: 400,
      });
    }

    // Cannot request from own organisation
    if (
      req.user.organisationId &&
      listing.donorOrganisationId.toString() === req.user.organisationId.toString()
    ) {
      // Revert decrement
      await Listing.findByIdAndUpdate(listingId, { $inc: { availableQuantity: qty } });
      return res.status(400).json({
        error: 'BadRequest',
        message: 'You cannot request supplies from your own organisation',
        statusCode: 400,
      });
    }

    const newRequest = new Request({
      listingId: listing._id,
      donorOrganisationId: listing.donorOrganisationId,
      recipientOrganisationId: req.user.organisationId,
      recipientUserId: req.user._id,
      requestedQuantity: qty,
      message: message ? message.trim() : '',
      status: 'pending',
    });

    await newRequest.save();

    // Create notification for donor user
    const recipientOrg = await Organisation.findById(req.user.organisationId);
    const orgName = recipientOrg ? recipientOrg.name : req.user.name;

    await Notification.create({
      userId: listing.donorUserId,
      type: 'new_request',
      title: 'New Request Received',
      message: `${orgName} has requested ${qty} ${listing.unit} of "${listing.title}".`,
      relatedEntityId: newRequest._id,
      relatedEntityType: 'Request',
    });

    const populatedRequest = await Request.findById(newRequest._id)
      .populate('listingId')
      .populate('donorOrganisationId')
      .populate('recipientOrganisationId')
      .populate('recipientUserId', 'name email');

    const doc = populatedRequest.toObject();
    doc.listing = doc.listingId;
    doc.donorOrganisation = doc.donorOrganisationId;
    doc.recipientOrganisation = doc.recipientOrganisationId;

    return res.status(201).json({
      message: 'Request submitted successfully',
      request: doc,
    });
  } catch (error) {
    next(error);
  }
};

const getSentRequests = async (req, res, next) => {
  try {
    const query = {
      $or: [
        { recipientOrganisationId: req.user.organisationId },
        { recipientUserId: req.user._id },
      ],
    };

    const requests = await Request.find(query)
      .populate('listingId')
      .populate('donorOrganisationId')
      .populate('recipientOrganisationId')
      .populate('recipientUserId', 'name email')
      .sort({ createdAt: -1 });

    const formatted = requests.map((reqDoc) => {
      const doc = reqDoc.toObject();
      doc.listing = doc.listingId;
      doc.donorOrganisation = doc.donorOrganisationId;
      doc.recipientOrganisation = doc.recipientOrganisationId;
      return doc;
    });

    return res.status(200).json({
      count: formatted.length,
      requests: formatted,
    });
  } catch (error) {
    next(error);
  }
};

const getReceivedRequests = async (req, res, next) => {
  try {
    const requests = await Request.find({
      donorOrganisationId: req.user.organisationId,
    })
      .populate('listingId')
      .populate('donorOrganisationId')
      .populate('recipientOrganisationId')
      .populate('recipientUserId', 'name email')
      .sort({ createdAt: -1 });

    const formatted = requests.map((reqDoc) => {
      const doc = reqDoc.toObject();
      doc.listing = doc.listingId;
      doc.donorOrganisation = doc.donorOrganisationId;
      doc.recipientOrganisation = doc.recipientOrganisationId;
      return doc;
    });

    return res.status(200).json({
      count: formatted.length,
      requests: formatted,
    });
  } catch (error) {
    next(error);
  }
};

const getRequestById = async (req, res, next) => {
  try {
    const request = await Request.findById(req.params.id)
      .populate('listingId')
      .populate('donorOrganisationId')
      .populate('recipientOrganisationId')
      .populate('recipientUserId', 'name email');

    if (!request) {
      return res.status(404).json({
        error: 'NotFound',
        message: 'Request not found',
        statusCode: 404,
      });
    }

    const isDonor =
      req.user.organisationId &&
      request.donorOrganisationId._id.toString() === req.user.organisationId.toString();
    const isRecipient =
      (req.user.organisationId &&
        request.recipientOrganisationId._id.toString() === req.user.organisationId.toString()) ||
      request.recipientUserId._id.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';

    if (!isDonor && !isRecipient && !isAdmin) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'You are not authorized to view this request',
        statusCode: 403,
      });
    }

    const doc = request.toObject();
    doc.listing = doc.listingId;
    doc.donorOrganisation = doc.donorOrganisationId;
    doc.recipientOrganisation = doc.recipientOrganisationId;

    return res.status(200).json({
      request: doc,
    });
  } catch (error) {
    next(error);
  }
};

const updateRequestStatus = async (req, res, next) => {
  try {
    const { status, rejectionReason } = req.body;

    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({
        error: 'ValidationError',
        message: "Status must be either 'approved' or 'rejected'",
        statusCode: 400,
      });
    }

    const request = await Request.findById(req.params.id);
    if (!request) {
      return res.status(404).json({
        error: 'NotFound',
        message: 'Request not found',
        statusCode: 404,
      });
    }

    // Must be donor organisation or admin
    const isDonor =
      req.user.organisationId &&
      request.donorOrganisationId.toString() === req.user.organisationId.toString();
    const isAdmin = req.user.role === 'admin';

    if (!isDonor && !isAdmin) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'Only the donor organisation can approve or reject this request',
        statusCode: 403,
      });
    }

    if (request.status !== 'pending') {
      return res.status(400).json({
        error: 'BadRequest',
        message: `Cannot update request with status '${request.status}'`,
        statusCode: 400,
      });
    }

    const listing = await Listing.findById(request.listingId);

    if (status === 'approved') {
      request.status = 'approved';
      await request.save();

      // On approve: if availableQuantity becomes 0, set listing status = 'reserved'
      if (listing) {
        if (listing.availableQuantity === 0) {
          listing.status = 'reserved';
          await listing.save();
        }
      }

      // Notification for recipient
      await Notification.create({
        userId: request.recipientUserId,
        type: 'request_approved',
        title: 'Request Approved',
        message: `Your request for ${request.requestedQuantity} ${listing?.unit || 'units'} of "${listing?.title || 'supplies'}" was approved!`,
        relatedEntityId: request._id,
        relatedEntityType: 'Request',
      });
    } else if (status === 'rejected') {
      request.status = 'rejected';
      request.rejectionReason = rejectionReason || 'Request declined by donor';
      await request.save();

      // On reject: atomic add back to availableQuantity
      if (listing) {
        const updatedListing = await Listing.findByIdAndUpdate(
          listing._id,
          { $inc: { availableQuantity: request.requestedQuantity } },
          { new: true }
        );

        if (updatedListing && updatedListing.status === 'reserved' && updatedListing.availableQuantity > 0) {
          updatedListing.status = 'active';
          await updatedListing.save();
        }
      }

      // Notification for recipient
      await Notification.create({
        userId: request.recipientUserId,
        type: 'request_rejected',
        title: 'Request Declined',
        message: `Your request for "${listing?.title || 'supplies'}" was declined. Reason: ${request.rejectionReason}`,
        relatedEntityId: request._id,
        relatedEntityType: 'Request',
      });
    }

    const populatedRequest = await Request.findById(request._id)
      .populate('listingId')
      .populate('donorOrganisationId')
      .populate('recipientOrganisationId')
      .populate('recipientUserId', 'name email');

    const doc = populatedRequest.toObject();
    doc.listing = doc.listingId;
    doc.donorOrganisation = doc.donorOrganisationId;
    doc.recipientOrganisation = doc.recipientOrganisationId;

    return res.status(200).json({
      message: `Request status updated to ${status}`,
      request: doc,
    });
  } catch (error) {
    next(error);
  }
};

const updateHandover = async (req, res, next) => {
  try {
    const { handoverDate, donorConfirmed, recipientConfirmed } = req.body;

    const request = await Request.findById(req.params.id);
    if (!request) {
      return res.status(404).json({
        error: 'NotFound',
        message: 'Request not found',
        statusCode: 404,
      });
    }

    if (!['approved', 'completed'].includes(request.status)) {
      return res.status(400).json({
        error: 'BadRequest',
        message: `Handover can only be updated for approved requests (current status: ${request.status})`,
        statusCode: 400,
      });
    }

    const isDonor =
      req.user.organisationId &&
      request.donorOrganisationId.toString() === req.user.organisationId.toString();
    const isRecipient =
      (req.user.organisationId &&
        request.recipientOrganisationId.toString() === req.user.organisationId.toString()) ||
      request.recipientUserId.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';

    if (!isDonor && !isRecipient && !isAdmin) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'You are not authorized to update handover for this request',
        statusCode: 403,
      });
    }

    const listing = await Listing.findById(request.listingId);

    // Donors can set handoverDate and donorConfirmed=true
    if (isDonor || isAdmin) {
      if (handoverDate !== undefined) {
        request.handoverDate = new Date(handoverDate);
      }
      if (donorConfirmed === true) {
        request.donorConfirmed = true;

        // Notify recipient of donor confirmation
        await Notification.create({
          userId: request.recipientUserId,
          type: 'handover_update',
          title: 'Handover Confirmed by Donor',
          message: `The donor has confirmed handover of "${listing?.title || 'supplies'}". Please confirm receipt when received.`,
          relatedEntityId: request._id,
          relatedEntityType: 'Request',
        });
      }
    }

    // Recipients can set recipientConfirmed=true
    if (isRecipient || isAdmin) {
      if (recipientConfirmed === true) {
        request.recipientConfirmed = true;

        // Notify donor of receipt confirmation
        if (listing?.donorUserId) {
          await Notification.create({
            userId: listing.donorUserId,
            type: 'receipt_confirmed',
            title: 'Receipt Confirmed by Recipient',
            message: `The recipient has confirmed receipt of "${listing.title}".`,
            relatedEntityId: request._id,
            relatedEntityType: 'Request',
          });
        }
      }
    }

    // When both confirmed: set request status = 'completed'
    if (request.donorConfirmed && request.recipientConfirmed) {
      request.status = 'completed';

      // Check if listing availableQuantity reaches 0 and all requests completed
      if (listing) {
        const remainingIncompleteRequests = await Request.find({
          listingId: listing._id,
          _id: { $ne: request._id },
          status: { $in: ['pending', 'approved'] },
        });

        if (listing.availableQuantity === 0 && remainingIncompleteRequests.length === 0) {
          listing.status = 'completed';
          await listing.save();
        }
      }
    }

    await request.save();

    const populatedRequest = await Request.findById(request._id)
      .populate('listingId')
      .populate('donorOrganisationId')
      .populate('recipientOrganisationId')
      .populate('recipientUserId', 'name email');

    const doc = populatedRequest.toObject();
    doc.listing = doc.listingId;
    doc.donorOrganisation = doc.donorOrganisationId;
    doc.recipientOrganisation = doc.recipientOrganisationId;

    return res.status(200).json({
      message: 'Handover details updated successfully',
      request: doc,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createRequest,
  getSentRequests,
  getReceivedRequests,
  getRequestById,
  updateRequestStatus,
  updateHandover,
};
