const mongoose = require('mongoose');

const listingSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      trim: true,
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      enum: [
        'first_aid',
        'hygiene',
        'mobility_aids',
        'medical_accessories',
        'personal_care',
        'other_care_supplies',
      ],
    },
    quantity: {
      type: Number,
      required: [true, 'Quantity is required'],
      min: [1, 'Quantity must be at least 1'],
    },
    availableQuantity: {
      type: Number,
      required: [true, 'Available quantity is required'],
      min: [0, 'Available quantity cannot be negative'],
    },
    unit: {
      type: String,
      required: [true, 'Unit is required'],
      trim: true,
    },
    condition: {
      type: String,
      required: [true, 'Condition is required'],
      enum: ['unopened_new', 'unopened_original_packaging', 'sealed'],
    },
    expiryDate: {
      type: Date,
      default: null,
    },
    pickupLocation: {
      address: { type: String, trim: true, default: '' },
      city: { type: String, trim: true, default: '' },
      postcode: { type: String, trim: true, default: '' },
    },
    imageUrl: {
      type: String,
      trim: true,
      default: null,
    },
    handoverInstructions: {
      type: String,
      trim: true,
      default: '',
    },
    donorOrganisationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organisation',
      required: [true, 'Donor organisation is required'],
    },
    donorUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Donor user is required'],
    },
    status: {
      type: String,
      enum: ['active', 'reserved', 'completed', 'expired', 'withdrawn'],
      default: 'active',
    },
  },
  {
    timestamps: true,
  }
);

listingSchema.pre('save', function (next) {
  if (this.expiryDate && new Date(this.expiryDate) < new Date() && this.status !== 'withdrawn' && this.status !== 'completed') {
    this.status = 'expired';
  }
  next();
});

const Listing = mongoose.model('Listing', listingSchema);

module.exports = Listing;
