const Organisation = require('../models/Organisation');
const User = require('../models/User');
const Listing = require('../models/Listing');
const Request = require('../models/Request');
const Notification = require('../models/Notification');

const getOrganisations = async (req, res, next) => {
  try {
    const { verificationStatus } = req.query;
    const filter = {};

    if (verificationStatus) {
      filter.verificationStatus = verificationStatus;
    }

    const organisations = await Organisation.find(filter).sort({ createdAt: -1 });

    const orgsWithUsers = await Promise.all(
      organisations.map(async (org) => {
        const users = await User.find({ organisationId: org._id });
        const doc = org.toObject();
        doc.users = users;
        return doc;
      })
    );

    return res.status(200).json({
      count: orgsWithUsers.length,
      organisations: orgsWithUsers,
    });
  } catch (error) {
    next(error);
  }
};

const updateVerification = async (req, res, next) => {
  try {
    const { verificationStatus, rejectionReason } = req.body;

    if (!['verified', 'rejected', 'suspended', 'pending'].includes(verificationStatus)) {
      return res.status(400).json({
        error: 'ValidationError',
        message: "verificationStatus must be 'verified', 'rejected', 'suspended', or 'pending'",
        statusCode: 400,
      });
    }

    const organisation = await Organisation.findById(req.params.id);
    if (!organisation) {
      return res.status(404).json({
        error: 'NotFound',
        message: 'Organisation not found',
        statusCode: 404,
      });
    }

    organisation.verificationStatus = verificationStatus;

    if (verificationStatus === 'verified') {
      organisation.verifiedAt = new Date();
      organisation.rejectionReason = null;
    } else if (verificationStatus === 'rejected') {
      organisation.rejectionReason = rejectionReason || 'Organisation verification declined';
    } else if (verificationStatus === 'suspended') {
      organisation.rejectionReason = rejectionReason || 'Organisation account suspended';
    }

    await organisation.save();

    // Notify organisation user(s)
    const orgUsers = await User.find({ organisationId: organisation._id });

    for (const user of orgUsers) {
      let notifType = 'verification_approved';
      let notifTitle = 'Organisation Verified';
      let notifMessage = `Your organisation "${organisation.name}" has been verified! You now have full access to platform features.`;

      if (verificationStatus === 'rejected') {
        notifType = 'verification_rejected';
        notifTitle = 'Verification Rejected';
        notifMessage = `Your organisation "${organisation.name}" verification was rejected. Reason: ${organisation.rejectionReason}`;
      } else if (verificationStatus === 'suspended') {
        notifType = 'verification_rejected';
        notifTitle = 'Organisation Suspended';
        notifMessage = `Your organisation "${organisation.name}" has been suspended. Reason: ${organisation.rejectionReason}`;
      }

      await Notification.create({
        userId: user._id,
        type: notifType,
        title: notifTitle,
        message: notifMessage,
        relatedEntityId: organisation._id,
        relatedEntityType: 'Organisation',
      });
    }

    return res.status(200).json({
      message: `Organisation verification status updated to ${verificationStatus}`,
      organisation,
    });
  } catch (error) {
    next(error);
  }
};

const getStats = async (req, res, next) => {
  try {
    const [
      totalUsers,
      donorsCount,
      recipientsCount,
      adminsCount,
      totalOrganisations,
      verifiedOrganisations,
      pendingOrganisations,
      rejectedOrganisations,
      suspendedOrganisations,
      totalListings,
      activeListings,
      reservedListings,
      completedListings,
      expiredListings,
      totalRequests,
      pendingRequests,
      approvedRequests,
      completedRequests,
      rejectedRequests,
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ role: 'donor' }),
      User.countDocuments({ role: 'recipient' }),
      User.countDocuments({ role: 'admin' }),
      Organisation.countDocuments(),
      Organisation.countDocuments({ verificationStatus: 'verified' }),
      Organisation.countDocuments({ verificationStatus: 'pending' }),
      Organisation.countDocuments({ verificationStatus: 'rejected' }),
      Organisation.countDocuments({ verificationStatus: 'suspended' }),
      Listing.countDocuments(),
      Listing.countDocuments({ status: 'active' }),
      Listing.countDocuments({ status: 'reserved' }),
      Listing.countDocuments({ status: 'completed' }),
      Listing.countDocuments({ status: 'expired' }),
      Request.countDocuments(),
      Request.countDocuments({ status: 'pending' }),
      Request.countDocuments({ status: 'approved' }),
      Request.countDocuments({ status: 'completed' }),
      Request.countDocuments({ status: 'rejected' }),
    ]);

    return res.status(200).json({
      users: {
        total: totalUsers,
        donors: donorsCount,
        recipients: recipientsCount,
        admins: adminsCount,
      },
      organisations: {
        total: totalOrganisations,
        verified: verifiedOrganisations,
        pending: pendingOrganisations,
        rejected: rejectedOrganisations,
        suspended: suspendedOrganisations,
      },
      listings: {
        total: totalListings,
        active: activeListings,
        reserved: reservedListings,
        completed: completedListings,
        expired: expiredListings,
      },
      requests: {
        total: totalRequests,
        pending: pendingRequests,
        approved: approvedRequests,
        completed: completedRequests,
        rejected: rejectedRequests,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getOrganisations,
  updateVerification,
  getStats,
};
