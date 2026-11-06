const mongoose = require('mongoose');

const organisationSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Organisation name is required'],
      trim: true,
    },
    type: {
      type: String,
      enum: ['charity', 'ngo', 'community_group', 'health_trust', 'care_home', 'other'],
      default: 'other',
    },
    email: {
      type: String,
      required: [true, 'Organisation email is required'],
      trim: true,
      lowercase: true,
    },
    phone: {
      type: String,
      required: [true, 'Organisation phone is required'],
      trim: true,
    },
    address: {
      street: { type: String, trim: true, default: '' },
      city: { type: String, trim: true, default: '' },
      postcode: { type: String, trim: true, default: '' },
      country: { type: String, trim: true, default: 'UK' },
    },
    verificationStatus: {
      type: String,
      enum: ['pending', 'verified', 'rejected', 'suspended'],
      default: 'pending',
    },
    verifiedAt: {
      type: Date,
      default: null,
    },
    rejectionReason: {
      type: String,
      trim: true,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

const Organisation = mongoose.model('Organisation', organisationSchema);

module.exports = Organisation;
