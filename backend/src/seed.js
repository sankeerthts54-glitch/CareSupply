require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const User = require('./models/User');
const Organisation = require('./models/Organisation');
const Listing = require('./models/Listing');
const Request = require('./models/Request');
const Notification = require('./models/Notification');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/caresupply';

const seedDatabase = async () => {
  try {
    console.log(`Connecting to MongoDB at ${MONGO_URI}...`);
    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB.');

    // 1. Clear all existing collections
    console.log('Clearing existing database collections...');
    await Promise.all([
      User.deleteMany({}),
      Organisation.deleteMany({}),
      Listing.deleteMany({}),
      Request.deleteMany({}),
      Notification.deleteMany({}),
    ]);
    console.log('All collections cleared.');

    // 2. Prepare password hashes
    const adminPasswordHash = await bcrypt.hash('Admin1234!', 10);
    const demoPasswordHash = await bcrypt.hash('Demo1234!', 10);

    // 3. Create Admin User
    const adminUser = await User.create({
      name: 'System Administrator',
      email: 'admin@caresupply.org',
      passwordHash: adminPasswordHash,
      role: 'admin',
      organisationId: null,
    });

    // 4. Create Organisations
    const donorOrg1 = await Organisation.create({
      name: 'Greenleaf Community Hub',
      type: 'charity',
      email: 'contact@greenleaf.org',
      phone: '+44 161 496 0123',
      address: {
        street: '42 Blossom Street',
        city: 'Manchester',
        postcode: 'M4 6BF',
        country: 'UK',
      },
      verificationStatus: 'verified',
      verifiedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
    });

    const donorOrg2 = await Organisation.create({
      name: 'Hope Centre Supplies',
      type: 'ngo',
      email: 'info@hopecenter.org',
      phone: '+44 207 946 0891',
      address: {
        street: '15 High Street, Islington',
        city: 'London',
        postcode: 'N1 2UQ',
        country: 'UK',
      },
      verificationStatus: 'verified',
      verifiedAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000),
    });

    const recipientOrg1 = await Organisation.create({
      name: 'Community Care Network',
      type: 'community_group',
      email: 'support@commcare.org',
      phone: '+44 121 496 0555',
      address: {
        street: '88 Victoria Road',
        city: 'Birmingham',
        postcode: 'B6 5HG',
        country: 'UK',
      },
      verificationStatus: 'verified',
      verifiedAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
    });

    const recipientOrg2 = await Organisation.create({
      name: 'City Support Services',
      type: 'care_home',
      email: 'liaison@citysupport.org',
      phone: '+44 113 496 0777',
      address: {
        street: '12 Park Square East',
        city: 'Leeds',
        postcode: 'LS1 2NE',
        country: 'UK',
      },
      verificationStatus: 'verified',
      verifiedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
    });

    const pendingOrg = await Organisation.create({
      name: 'Sunrise Volunteers',
      type: 'charity',
      email: 'contact@sunrise.org',
      phone: '+44 117 496 0444',
      address: {
        street: '7 Anchor Way',
        city: 'Bristol',
        postcode: 'BS1 5TT',
        country: 'UK',
      },
      verificationStatus: 'pending',
    });

    // 5. Create Users for each organisation
    const donorUser1 = await User.create({
      name: 'Sarah Jenkins',
      email: 'donor1@greenleaf.org',
      passwordHash: demoPasswordHash,
      role: 'donor',
      organisationId: donorOrg1._id,
    });

    const donorUser2 = await User.create({
      name: 'David Robinson',
      email: 'donor2@hopecenter.org',
      passwordHash: demoPasswordHash,
      role: 'donor',
      organisationId: donorOrg2._id,
    });

    const recipientUser1 = await User.create({
      name: 'Amara Patel',
      email: 'recipient1@commcare.org',
      passwordHash: demoPasswordHash,
      role: 'recipient',
      organisationId: recipientOrg1._id,
    });

    const recipientUser2 = await User.create({
      name: 'Marcus Thorne',
      email: 'recipient2@citysupport.org',
      passwordHash: demoPasswordHash,
      role: 'recipient',
      organisationId: recipientOrg2._id,
    });

    const pendingUser = await User.create({
      name: 'Fiona Gallagher',
      email: 'pending@sunrise.org',
      passwordHash: demoPasswordHash,
      role: 'donor',
      organisationId: pendingOrg._id,
    });

    console.log('Created Users & Organisations.');

    // 6. Create 12 realistic supply listings
    const now = Date.now();
    const day = 24 * 60 * 60 * 1000;

    const listingsData = [
      // 1. First Aid - Far expiry (Active, with a pending request)
      {
        title: 'Emergency Trauma First Aid Kits',
        description: 'Comprehensive HSE-compliant trauma first aid kits containing tourniquets, pressure bandages, burns dressings, and shears.',
        category: 'first_aid',
        quantity: 25,
        availableQuantity: 20, // 5 requested in pending request
        unit: 'kits',
        condition: 'unopened_new',
        expiryDate: new Date(now + 365 * day), // 1 year
        pickupLocation: {
          address: '42 Blossom Street',
          city: 'Manchester',
          postcode: 'M4 6BF',
        },
        imageUrl: 'https://images.unsplash.com/photo-1603398938378-e54eab446dde?auto=format&fit=crop&q=80&w=600',
        handoverInstructions: 'Pickup at main reception between 9am - 4pm Monday to Friday.',
        donorOrganisationId: donorOrg1._id,
        donorUserId: donorUser1._id,
        status: 'active',
      },
      // 2. First Aid - Near expiry (~28 days)
      {
        title: 'Sterile Gauze Bandages & Dressings',
        description: 'Individually wrapped conforming sterile bandages (10cm x 4m) suitable for wound dressing and sprain compression.',
        category: 'first_aid',
        quantity: 50,
        availableQuantity: 50,
        unit: 'boxes',
        condition: 'sealed',
        expiryDate: new Date(now + 28 * day), // 28 days (near expiry)
        pickupLocation: {
          address: '15 High Street, Islington',
          city: 'London',
          postcode: 'N1 2UQ',
        },
        imageUrl: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&q=80&w=600',
        handoverInstructions: 'Ring bell at side entrance. Loading bay available.',
        donorOrganisationId: donorOrg2._id,
        donorUserId: donorUser2._id,
        status: 'active',
      },
      // 3. Hygiene - Far expiry (Active, with a pending request)
      {
        title: 'Hospital Grade Antibacterial Hand Rub 500ml',
        description: '75% alcohol antiseptic hand sanitizer with pump dispensers. Fast-acting antimicrobial action.',
        category: 'hygiene',
        quantity: 100,
        availableQuantity: 90, // 10 requested in pending request
        unit: 'bottles',
        condition: 'unopened_original_packaging',
        expiryDate: new Date(now + 180 * day), // 6 months
        pickupLocation: {
          address: '15 High Street, Islington',
          city: 'London',
          postcode: 'N1 2UQ',
        },
        imageUrl: 'https://images.unsplash.com/photo-1584744982491-665216d95f8b?auto=format&fit=crop&q=80&w=600',
        handoverInstructions: 'Pallet storage area. Vans welcome for collection.',
        donorOrganisationId: donorOrg2._id,
        donorUserId: donorUser2._id,
        status: 'active',
      },
      // 4. Hygiene - No expiry
      {
        title: 'Adult Incontinence Care Pads (Extra Absorbent)',
        description: 'Heavy absorbency anatomical incontinence pads, pack of 30. Breathable outer layer with odor control technology.',
        category: 'hygiene',
        quantity: 40,
        availableQuantity: 40,
        unit: 'packs',
        condition: 'unopened_new',
        expiryDate: null,
        pickupLocation: {
          address: '42 Blossom Street',
          city: 'Manchester',
          postcode: 'M4 6BF',
        },
        imageUrl: 'https://images.unsplash.com/photo-1584017911766-d451b3d0e843?auto=format&fit=crop&q=80&w=600',
        handoverInstructions: 'Ask for warehouse coordinator upon arrival.',
        donorOrganisationId: donorOrg1._id,
        donorUserId: donorUser1._id,
        status: 'active',
      },
      // 5. Mobility Aids - No expiry (Active)
      {
        title: 'Lightweight Folding Aluminum Wheelchairs',
        description: 'Transit wheelchairs with attendant handbrakes, swing-away footrests, and 18-inch seat width. Weight capacity 115kg.',
        category: 'mobility_aids',
        quantity: 5,
        availableQuantity: 5,
        unit: 'units',
        condition: 'unopened_original_packaging',
        expiryDate: null,
        pickupLocation: {
          address: '15 High Street, Islington',
          city: 'London',
          postcode: 'N1 2UQ',
        },
        imageUrl: 'https://images.unsplash.com/photo-1576765608535-5f04d1e3f289?auto=format&fit=crop&q=80&w=600',
        handoverInstructions: 'Large boxes. Station wagon or estate car recommended for collection.',
        donorOrganisationId: donorOrg2._id,
        donorUserId: donorUser2._id,
        status: 'active',
      },
      // 6. Mobility Aids - Reserved (All 15 units approved in requests)
      {
        title: 'Adjustable Forearm Walking Crutches (Pair)',
        description: 'Ergonomic handle aluminum crutches with push-button height adjustment. Non-slip rubber ferrule feet.',
        category: 'mobility_aids',
        quantity: 15,
        availableQuantity: 0, // Fully allocated via approved requests
        unit: 'pairs',
        condition: 'unopened_new',
        expiryDate: null,
        pickupLocation: {
          address: '42 Blossom Street',
          city: 'Manchester',
          postcode: 'M4 6BF',
        },
        imageUrl: 'https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?auto=format&fit=crop&q=80&w=600',
        handoverInstructions: 'Collect from logistics bay C.',
        donorOrganisationId: donorOrg1._id,
        donorUserId: donorUser1._id,
        status: 'reserved',
      },
      // 7. Medical Accessories - Active (had 1 rejected request)
      {
        title: 'Digital Upper Arm Blood Pressure Monitors',
        description: 'Clinically validated automated blood pressure and pulse rate monitors with standard & large cuff sizes included.',
        category: 'medical_accessories',
        quantity: 12,
        availableQuantity: 12, // Rejected request returned the quantity
        unit: 'units',
        condition: 'unopened_new',
        expiryDate: null,
        pickupLocation: {
          address: '15 High Street, Islington',
          city: 'London',
          postcode: 'N1 2UQ',
        },
        imageUrl: 'https://images.unsplash.com/photo-1631815588090-d4bfec5b1ccb?auto=format&fit=crop&q=80&w=600',
        handoverInstructions: 'Please show collection ID code upon pickup.',
        donorOrganisationId: donorOrg2._id,
        donorUserId: donorUser2._id,
        status: 'active',
      },
      // 8. Medical Accessories - Active
      {
        title: 'Infrared Non-Contact Forehead Thermometers',
        description: 'Medical precision non-contact infrared thermometers with 1-second temperature readout and LCD fever alert.',
        category: 'medical_accessories',
        quantity: 20,
        availableQuantity: 20,
        unit: 'units',
        condition: 'unopened_original_packaging',
        expiryDate: null,
        pickupLocation: {
          address: '42 Blossom Street',
          city: 'Manchester',
          postcode: 'M4 6BF',
        },
        imageUrl: 'https://images.unsplash.com/photo-1584017911766-d451b3d0e843?auto=format&fit=crop&q=80&w=600',
        handoverInstructions: 'Reception staff will sign off collection.',
        donorOrganisationId: donorOrg1._id,
        donorUserId: donorUser1._id,
        status: 'active',
      },
      // 9. Personal Care - Near expiry (30 days)
      {
        title: 'Sensitive Skin Gentle Cleansing Foam & Wipes',
        description: 'Hypoallergenic no-rinse skin cleansing foam (400ml) paired with dermatological patient wipes. Fragrance free.',
        category: 'personal_care',
        quantity: 30,
        availableQuantity: 30,
        unit: 'cases',
        condition: 'sealed',
        expiryDate: new Date(now + 30 * day), // 30 days
        pickupLocation: {
          address: '42 Blossom Street',
          city: 'Manchester',
          postcode: 'M4 6BF',
        },
        imageUrl: 'https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&q=80&w=600',
        handoverInstructions: 'Palletized stock. Hand truck provided on site.',
        donorOrganisationId: donorOrg1._id,
        donorUserId: donorUser1._id,
        status: 'active',
      },
      // 10. Personal Care - Far expiry (90 days)
      {
        title: 'Barrier Cream for Pressure Sore Prevention 100g',
        description: 'Zinc oxide moisture barrier cream protecting vulnerable skin against incontinence and pressure breakdown.',
        category: 'personal_care',
        quantity: 60,
        availableQuantity: 60,
        unit: 'tubes',
        condition: 'unopened_new',
        expiryDate: new Date(now + 90 * day),
        pickupLocation: {
          address: '15 High Street, Islington',
          city: 'London',
          postcode: 'N1 2UQ',
        },
        imageUrl: 'https://images.unsplash.com/photo-1556228722-d0b5de73171c?auto=format&fit=crop&q=80&w=600',
        handoverInstructions: 'Dispatched through goods entrance.',
        donorOrganisationId: donorOrg2._id,
        donorUserId: donorUser2._id,
        status: 'active',
      },
      // 11. Other Care Supplies - Far expiry (18 months)
      {
        title: 'Disposable Nitrile Examination Gloves (Size M)',
        description: 'Powder-free, latex-free medical grade blue nitrile gloves. Box of 100 gloves with textured fingertips.',
        category: 'other_care_supplies',
        quantity: 80,
        availableQuantity: 80,
        unit: 'boxes',
        condition: 'unopened_new',
        expiryDate: new Date(now + 540 * day),
        pickupLocation: {
          address: '42 Blossom Street',
          city: 'Manchester',
          postcode: 'M4 6BF',
        },
        imageUrl: 'https://images.unsplash.com/photo-1584017911766-d451b3d0e843?auto=format&fit=crop&q=80&w=600',
        handoverInstructions: 'Standard courier or local pickup available.',
        donorOrganisationId: donorOrg1._id,
        donorUserId: donorUser1._id,
        status: 'active',
      },
      // 12. Other Care Supplies - Completed (Fully completed handover)
      {
        title: 'Washable Waterproof Bed Protection Pads',
        description: 'Multi-layer reusable absorbent mattress protector pads with tuck-in flaps. Machine washable up to 90C.',
        category: 'other_care_supplies',
        quantity: 10,
        availableQuantity: 0,
        unit: 'packs',
        condition: 'unopened_new',
        expiryDate: null,
        pickupLocation: {
          address: '15 High Street, Islington',
          city: 'London',
          postcode: 'N1 2UQ',
        },
        imageUrl: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&q=80&w=600',
        handoverInstructions: 'Handover completed at warehouse.',
        donorOrganisationId: donorOrg2._id,
        donorUserId: donorUser2._id,
        status: 'completed',
      },
    ];

    const createdListings = await Listing.insertMany(listingsData);
    console.log(`Created ${createdListings.length} supply listings.`);

    // 7. Create mix of requests:
    // - 2 pending requests
    // - 2 approved requests
    // - 1 rejected request (with reason)
    // - 1 completed request (both confirmed)

    const pendingRequest1 = await Request.create({
      listingId: createdListings[0]._id, // Emergency Trauma First Aid Kits
      donorOrganisationId: donorOrg1._id,
      recipientOrganisationId: recipientOrg1._id,
      recipientUserId: recipientUser1._id,
      requestedQuantity: 5,
      message: 'Urgent supplies needed for our local community first-response volunteers program in Birmingham.',
      status: 'pending',
    });

    const pendingRequest2 = await Request.create({
      listingId: createdListings[2]._id, // Hand Rub
      donorOrganisationId: donorOrg2._id,
      recipientOrganisationId: recipientOrg2._id,
      recipientUserId: recipientUser2._id,
      requestedQuantity: 10,
      message: 'Restocking hand sanitizer for care home visitors and residents.',
      status: 'pending',
    });

    const approvedRequest1 = await Request.create({
      listingId: createdListings[5]._id, // Crutches
      donorOrganisationId: donorOrg1._id,
      recipientOrganisationId: recipientOrg1._id,
      recipientUserId: recipientUser1._id,
      requestedQuantity: 5,
      message: 'For vulnerable elderly residents recovering from surgery.',
      status: 'approved',
      handoverDate: new Date(now + 2 * day),
      donorConfirmed: false,
      recipientConfirmed: false,
    });

    const approvedRequest2 = await Request.create({
      listingId: createdListings[5]._id, // Crutches
      donorOrganisationId: donorOrg1._id,
      recipientOrganisationId: recipientOrg2._id,
      recipientUserId: recipientUser2._id,
      requestedQuantity: 10,
      message: 'Supplying our outpatient mobility support clinic.',
      status: 'approved',
      handoverDate: new Date(now + 3 * day),
      donorConfirmed: true,
      recipientConfirmed: false,
    });

    const rejectedRequest = await Request.create({
      listingId: createdListings[6]._id, // Blood Pressure Monitors
      donorOrganisationId: donorOrg2._id,
      recipientOrganisationId: recipientOrg2._id,
      recipientUserId: recipientUser2._id,
      requestedQuantity: 20,
      message: 'Requesting full batch for community outreach centers.',
      status: 'rejected',
      rejectionReason: 'Exceeded maximum allocation limit per regional facility (max 10 allowed).',
    });

    const completedRequest = await Request.create({
      listingId: createdListings[11]._id, // Waterproof Bed Pads
      donorOrganisationId: donorOrg2._id,
      recipientOrganisationId: recipientOrg1._id,
      recipientUserId: recipientUser1._id,
      requestedQuantity: 10,
      message: 'Needed for hospice bed care support.',
      status: 'completed',
      handoverDate: new Date(now - 3 * day),
      donorConfirmed: true,
      recipientConfirmed: true,
    });

    console.log('Created 6 requests (2 pending, 2 approved, 1 rejected, 1 completed).');

    // 8. Create notifications for each user
    const notifications = [
      // Admin notifications
      {
        userId: adminUser._id,
        type: 'new_request',
        title: 'New Organisation Pending Verification',
        message: 'Sunrise Volunteers has submitted registration details and awaits review.',
        read: false,
        relatedEntityId: pendingOrg._id,
        relatedEntityType: 'Organisation',
      },
      {
        userId: adminUser._id,
        type: 'verification_approved',
        title: 'Organisation Verified',
        message: 'City Support Services was successfully verified.',
        read: true,
        relatedEntityId: recipientOrg2._id,
        relatedEntityType: 'Organisation',
      },

      // Donor 1 notifications
      {
        userId: donorUser1._id,
        type: 'new_request',
        title: 'New Request Received',
        message: 'Community Care Network has requested 5 kits of "Emergency Trauma First Aid Kits".',
        read: false,
        relatedEntityId: pendingRequest1._id,
        relatedEntityType: 'Request',
      },
      {
        userId: donorUser1._id,
        type: 'handover_update',
        title: 'Handover Scheduled',
        message: 'Handover scheduled with City Support Services for 10 pairs of crutches.',
        read: true,
        relatedEntityId: approvedRequest2._id,
        relatedEntityType: 'Request',
      },

      // Donor 2 notifications
      {
        userId: donorUser2._id,
        type: 'new_request',
        title: 'New Request Received',
        message: 'City Support Services requested 10 bottles of "Hospital Grade Antibacterial Hand Rub 500ml".',
        read: false,
        relatedEntityId: pendingRequest2._id,
        relatedEntityType: 'Request',
      },
      {
        userId: donorUser2._id,
        type: 'receipt_confirmed',
        title: 'Handover Completed',
        message: 'Community Care Network confirmed receipt of 10 packs of "Washable Waterproof Bed Protection Pads".',
        read: true,
        relatedEntityId: completedRequest._id,
        relatedEntityType: 'Request',
      },

      // Recipient 1 notifications
      {
        userId: recipientUser1._id,
        type: 'verification_approved',
        title: 'Organisation Verified',
        message: 'Community Care Network is verified! You can now request supplies directly.',
        read: true,
        relatedEntityId: recipientOrg1._id,
        relatedEntityType: 'Organisation',
      },
      {
        userId: recipientUser1._id,
        type: 'request_approved',
        title: 'Request Approved',
        message: 'Greenleaf Community Hub approved your request for 5 pairs of Walking Crutches.',
        read: false,
        relatedEntityId: approvedRequest1._id,
        relatedEntityType: 'Request',
      },
      {
        userId: recipientUser1._id,
        type: 'receipt_confirmed',
        title: 'Receipt Confirmed',
        message: 'Handover completed for 10 packs of "Washable Waterproof Bed Protection Pads".',
        read: true,
        relatedEntityId: completedRequest._id,
        relatedEntityType: 'Request',
      },

      // Recipient 2 notifications
      {
        userId: recipientUser2._id,
        type: 'request_approved',
        title: 'Request Approved',
        message: 'Greenleaf Community Hub approved your request for 10 pairs of Walking Crutches.',
        read: false,
        relatedEntityId: approvedRequest2._id,
        relatedEntityType: 'Request',
      },
      {
        userId: recipientUser2._id,
        type: 'request_rejected',
        title: 'Request Declined',
        message: 'Hope Centre Supplies declined your request for Blood Pressure Monitors. Reason: Exceeded maximum allocation limit per regional facility.',
        read: true,
        relatedEntityId: rejectedRequest._id,
        relatedEntityType: 'Request',
      },

      // Pending org user notifications
      {
        userId: pendingUser._id,
        type: 'new_request',
        title: 'Registration Under Review',
        message: 'Your organisation registration for Sunrise Volunteers has been submitted and is pending admin verification.',
        read: false,
        relatedEntityId: pendingOrg._id,
        relatedEntityType: 'Organisation',
      },
    ];

    await Notification.insertMany(notifications);
    console.log(`Created ${notifications.length} notifications.`);

    console.log('\n=========================================');
    console.log('Seed complete! Summary of database items:');
    console.log('=========================================');
    console.log(`- Users: 6 (1 admin, 3 donors, 2 recipients)`);
    console.log(`  * Admin: admin@caresupply.org / Admin1234!`);
    console.log(`  * Donor 1: donor1@greenleaf.org / Demo1234! (Greenleaf Community Hub - verified)`);
    console.log(`  * Donor 2: donor2@hopecenter.org / Demo1234! (Hope Centre Supplies - verified)`);
    console.log(`  * Recipient 1: recipient1@commcare.org / Demo1234! (Community Care Network - verified)`);
    console.log(`  * Recipient 2: recipient2@citysupport.org / Demo1234! (City Support Services - verified)`);
    console.log(`  * Pending Donor: pending@sunrise.org / Demo1234! (Sunrise Volunteers - pending)`);
    console.log(`- Organisations: 5 (4 verified, 1 pending)`);
    console.log(`- Supply Listings: 12 across 6 categories (10 active, 1 reserved, 1 completed)`);
    console.log(`- Requests: 6 (2 pending, 2 approved, 1 rejected, 1 completed)`);
    console.log(`- Notifications: ${notifications.length} distributed across all users`);
    console.log('=========================================\n');

    await mongoose.disconnect();
    console.log('Disconnected from MongoDB.');
    process.exit(0);
  } catch (error) {
    console.error('Seeding failed with error:', error);
    process.exit(1);
  }
};

if (require.main === module) {
  seedDatabase();
}

module.exports = seedDatabase;
