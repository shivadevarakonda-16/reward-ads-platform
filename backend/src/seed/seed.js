import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { connectDB, disconnectDB } from '../config/db.js';
import { env } from '../config/env.js';

import { User } from '../models/User.js';
import { Sponsor } from '../models/Sponsor.js';
import { Product } from '../models/Product.js';
import { Campaign } from '../models/Campaign.js';
import { AdView } from '../models/AdView.js';
import { Activity } from '../models/Activity.js';
import { ReferralLink } from '../models/ReferralLink.js';
import { ReferralVisit } from '../models/ReferralVisit.js';
import { Reward } from '../models/Reward.js';
import { Transaction } from '../models/Transaction.js';
import { Coupon } from '../models/Coupon.js';
import { CouponRedemption } from '../models/CouponRedemption.js';
import { AuditLog } from '../models/AuditLog.js';
import { Notification } from '../models/Notification.js';

const SAMPLE_VIDEOS = [
  {
    url: '/videos/ad1.mp4',
    poster: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=800&auto=format&fit=crop&q=80',
    duration: 15
  },
  {
    url: '/videos/ad2.mp4',
    poster: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&auto=format&fit=crop&q=80',
    duration: 15
  },
  {
    url: '/videos/ad3.mp4',
    poster: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&auto=format&fit=crop&q=80',
    duration: 15
  },
  {
    url: '/videos/ad4.mp4',
    poster: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&auto=format&fit=crop&q=80',
    duration: 15
  },
  {
    url: '/videos/ad5.mp4',
    poster: 'https://images.unsplash.com/photo-1546868871-7041f2a55e12?w=800&auto=format&fit=crop&q=80',
    duration: 15
  },
  {
    url: '/videos/ad6.mp4',
    poster: 'https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=800&auto=format&fit=crop&q=80',
    duration: 15
  }
];

const CATEGORIES = [
  'Electronics',
  'Fashion',
  'Food & Beverage',
  'Beauty',
  'Fitness',
  'Travel',
  'Education',
  'Home',
  'Books'
];

const SPONSOR_NAMES = [
  { brand: 'boAt Lifestyle', category: 'Electronics', contact: 'Aman Gupta', web: 'https://boat-lifestyle.com' },
  { brand: 'Noise Tech', category: 'Electronics', contact: 'Gaurav Khatri', web: 'https://gonoise.com' },
  { brand: 'Fire-Boltt', category: 'Electronics', contact: 'Arnav Kishore', web: 'https://fireboltt.com' },
  { brand: 'Portronics India', category: 'Electronics', contact: 'Jasmeet Singh', web: 'https://portronics.com' },
  { brand: 'Zebronics', category: 'Electronics', contact: 'Pradeep Doshi', web: 'https://zebronics.com' },
  { brand: 'Boult Audio', category: 'Electronics', contact: 'Varun Gupta', web: 'https://boultaudio.com' },
  { brand: 'Mivi India', category: 'Electronics', contact: 'Midhula Devabhaktuni', web: 'https://mivi.in' },
  { brand: 'Nykaa Beauty', category: 'Beauty', contact: 'Falguni Nayar', web: 'https://nykaa.com' },
  { brand: 'Mamaearth', category: 'Beauty', contact: 'Ghazal Alagh', web: 'https://mamaearth.in' },
  { brand: 'mCaffeine Coffee Care', category: 'Beauty', contact: 'Tarun Sharma', web: 'https://mcaffeine.com' },
  { brand: 'The Derma Co', category: 'Beauty', contact: 'Varun Alagh', web: 'https://thedermaco.com' },
  { brand: 'Plum Goodness', category: 'Beauty', contact: 'Shankar Prasad', web: 'https://plumgoodness.com' },
  { brand: 'Sugar Cosmetics', category: 'Beauty', contact: 'Vineeta Singh', web: 'https://sugarcosmetics.com' },
  { brand: 'Forest Essentials', category: 'Beauty', contact: 'Mira Kulkarni', web: 'https://forestessentialsindia.com' },
  { brand: 'Bombay Shaving Company', category: 'Beauty', contact: 'Shantanu Deshpande', web: 'https://bombayshavingcompany.com' },
  { brand: 'Cult.fit', category: 'Fitness', contact: 'Mukesh Bansal', web: 'https://cult.fit' },
  { brand: 'MuscleBlaze', category: 'Fitness', contact: 'Sameer Maheshwari', web: 'https://muscleblaze.com' },
  { brand: 'Fast&Up India', category: 'Fitness', contact: 'Vijayraghavan Venugopal', web: 'https://fastandup.in' },
  { brand: 'HealthKart', category: 'Fitness', contact: 'Prashant Tandon', web: 'https://healthkart.com' },
  { brand: 'Oziva Clean Nutrition', category: 'Fitness', contact: 'Aarti Gill', web: 'https://oziva.in' },
  { brand: 'boldfit Athletics', category: 'Fitness', contact: 'Pallav Bihani', web: 'https://boldfit.in' },
  { brand: 'Chaayos Desi Chai', category: 'Food & Beverage', contact: 'Nitin Saluja', web: 'https://chaayos.com' },
  { brand: 'Paper Boat Drinks', category: 'Food & Beverage', contact: 'Neeraj Kakkar', web: 'https://paperboatfoods.com' },
  { brand: 'Sleepy Owl Coffee', category: 'Food & Beverage', contact: 'Ajai Thandi', web: 'https://sleepyowl.co' },
  { brand: 'Blue Tokai Roasters', category: 'Food & Beverage', contact: 'Matt Chitharanjan', web: 'https://bluetokaicoffee.com' },
  { brand: 'Open Secret Snacks', category: 'Food & Beverage', contact: 'Ahana Gautam', web: 'https://opensecret.in' },
  { brand: 'Epigamia Greek Yogurt', category: 'Food & Beverage', contact: 'Rohan Mirchandani', web: 'https://epigamia.com' },
  { brand: 'Yoga Bar Energy', category: 'Food & Beverage', contact: 'Suhasini Sampath', web: 'https://yogabars.in' },
  { brand: 'FabIndia Heritage', category: 'Fashion', contact: 'William Bissell', web: 'https://fabindia.com' },
  { brand: 'Snitch Menswear', category: 'Fashion', contact: 'Siddharth Dungarwal', web: 'https://snitch.co.in' },
  { brand: 'Bewakoof Apparel', category: 'Fashion', contact: 'Prabhkiran Singh', web: 'https://bewakoof.com' },
  { brand: 'The Souled Store', category: 'Fashion', contact: 'Vedang Patel', web: 'https://thesouledstore.com' },
  { brand: 'Campus Shoes', category: 'Fashion', contact: 'Nikhil Aggarwal', web: 'https://campusshoes.com' },
  { brand: 'Neemans Eco Shoes', category: 'Fashion', contact: 'Taran Chhabra', web: 'https://neemans.com' },
  { brand: 'Kalki Fashion', category: 'Fashion', contact: 'Saurabh Gupta', web: 'https://kalkifashion.com' },
  { brand: 'Urbanic Clothing', category: 'Fashion', contact: 'Rahul Dayama', web: 'https://urbanic.com' },
  { brand: 'Wakefit Sleep Solutions', category: 'Home', contact: 'Ankit Garg', web: 'https://wakefit.co' },
  { brand: 'Pepperfry Decor', category: 'Home', contact: 'Ashish Shah', web: 'https://pepperfry.com' },
  { brand: 'The Sleep Company', category: 'Home', contact: 'Priyanka Salot', web: 'https://thesleepcompany.in' },
  { brand: 'Home Centre India', category: 'Home', contact: 'Ramesh Kalyan', web: 'https://homecentre.in' },
  { brand: 'Duroflex Comfort', category: 'Home', contact: 'Mathew Chandy', web: 'https://duroflexworld.com' },
  { brand: 'Chalo Mobility', category: 'Travel', contact: 'Mohit Dubey', web: 'https://chalo.com' },
  { brand: 'MakeMyTrip Holidays', category: 'Travel', contact: 'Rajesh Magow', web: 'https://makemytrip.com' },
  { brand: 'EaseMyTrip Flights', category: 'Travel', contact: 'Nishant Pitti', web: 'https://easemytrip.com' },
  { brand: 'Tripoto Journeys', category: 'Travel', contact: 'Anirudh Gupta', web: 'https://tripoto.com' },
  { brand: 'Zostel Backpacker', category: 'Travel', contact: 'Dharamveer Chouhan', web: 'https://zostel.com' },
  { brand: 'Unacademy Learning', category: 'Education', contact: 'Gaurav Munjal', web: 'https://unacademy.com' },
  { brand: 'upGrad Careers', category: 'Education', contact: 'Ronnie Screwvala', web: 'https://upgrad.com' },
  { brand: 'PhysicsWallah', category: 'Education', contact: 'Alakh Pandey', web: 'https://pw.live' },
  { brand: 'Scaler Academy', category: 'Education', contact: 'Anshuman Singh', web: 'https://scaler.com' },
  { brand: 'Skill-Lync Engineering', category: 'Education', contact: 'Suryanarayanan P', web: 'https://skill-lync.com' },
  { brand: 'HarperCollins India', category: 'Books', contact: 'Ananth Padmanabhan', web: 'https://harpercollins.co.in' },
  { brand: 'Rupa Publications', category: 'Books', contact: 'Kapish Mehra', web: 'https://rupapublications.co.in' },
  { brand: 'Westland Books', category: 'Books', contact: 'Gautam Padmanabhan', web: 'https://westlandbooks.in' },
  { brand: 'Aleph Book Company', category: 'Books', contact: 'David Davidar', web: 'https://alephbookcompany.com' }
];

const INDIAN_FIRST_NAMES = [
  'Aarav', 'Vivaan', 'Aditya', 'Vihaan', 'Arjun', 'Sai', 'Reyansh', 'Ayaan', 'Krishna', 'Ishaan',
  'Shaurya', 'Atharv', 'Advik', 'Pranav', 'Advaith', 'Aaryan', 'Dhruv', 'Kabir', 'Ritvik', 'Darsh',
  'Diya', 'Saanvi', 'Ananya', 'Aadhya', 'Pari', 'Anushka', 'Navya', 'Angel', 'Myra', 'Sara',
  'Isha', 'Aarohi', 'Anika', 'Avani', 'Riya', 'Kavya', 'Siya', 'Shanaya', 'Anvi', 'Khushi',
  'Rohan', 'Sneha', 'Vikram', 'Pooja', 'Rahul', 'Neha', 'Karan', 'Priya', 'Amit', 'Sunita'
];

const INDIAN_LAST_NAMES = [
  'Sharma', 'Verma', 'Gupta', 'Malhotra', 'Bhatia', 'Saxena', 'Mehta', 'Chopra', 'Kapoor', 'Joshi',
  'Iyer', 'Nair', 'Menon', 'Pillai', 'Rao', 'Reddy', 'Patel', 'Shah', 'Deshmukh', 'Kulkarni',
  'Singh', 'Kaur', 'Das', 'Banerjee', 'Chatterjee', 'Mukherjee', 'Dutta', 'Ghosh', 'Roy', 'Bose'
];

export const seedDatabase = async () => {
  console.log('--- Wiping and seeding database with realistic sample data ---');
  await connectDB();

  // 1. Wipe all collections
  await Promise.all([
    User.deleteMany({}),
    Sponsor.deleteMany({}),
    Product.deleteMany({}),
    Campaign.deleteMany({}),
    AdView.deleteMany({}),
    Activity.deleteMany({}),
    ReferralLink.deleteMany({}),
    ReferralVisit.deleteMany({}),
    Reward.deleteMany({}),
    Transaction.deleteMany({}),
    Coupon.deleteMany({}),
    CouponRedemption.deleteMany({}),
    AuditLog.deleteMany({}),
    Notification.deleteMany({})
  ]);
  console.log('✓ Cleared all existing collections');

  // Pre-generate hashes
  const adminPasswordHash = await bcrypt.hash(env.ADMIN_SEED_PASSWORD, 10);
  const userPasswordHash = await bcrypt.hash('User@12345', 10);

  // 2. Create Admin
  const adminUser = await User.create({
    name: 'Platform Administrator',
    email: env.ADMIN_SEED_EMAIL.toLowerCase(),
    passwordHash: adminPasswordHash,
    role: 'admin',
    phone: '+91 9876543210',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&h=200&fit=crop',
    referralCode: 'ADM-LEAD01',
    status: 'active',
    walletBalance: 0,
    pendingBalance: 0,
    totalEarned: 0
  });

  // 3. Create 60 regular users
  const createdUsers = [];
  for (let i = 0; i < 60; i++) {
    const fName = INDIAN_FIRST_NAMES[i % INDIAN_FIRST_NAMES.length];
    const lName = INDIAN_LAST_NAMES[(i * 3) % INDIAN_LAST_NAMES.length];
    const name = `${fName} ${lName}`;
    const email = `${fName.toLowerCase()}.${lName.toLowerCase()}${i + 1}@rewardads.test`;
    const phone = `+91 98${(10000000 + i * 111111).toString().slice(0, 8)}`;
    const referralCode = `USR-${fName.toUpperCase().slice(0, 3)}${100 + i}`;

    // 3 users suspended
    const isSuspended = i === 12 || i === 27 || i === 44;
    // Some referred by prior users
    const referredBy = i > 5 && i % 3 === 0 ? createdUsers[i % 5]._id : null;

    const user = await User.create({
      name,
      email,
      passwordHash: userPasswordHash,
      role: 'user',
      phone,
      avatarUrl: `https://images.unsplash.com/photo-${1500000000000 + i * 9999}?w=150&h=150&fit=crop&auto=format`,
      referralCode,
      referredBy,
      status: isSuspended ? 'suspended' : 'active',
      deviceFingerprint: `device_fp_${(i % 18) + 1}`,
      walletBalance: 0, // will compute from consistent transactions
      pendingBalance: 0,
      totalEarned: 0
    });
    createdUsers.push(user);
  }
  console.log(`✓ Seeded 1 Admin and ${createdUsers.length} Users`);

  // 4. Create 55 Sponsors across 9 categories
  const createdSponsors = [];
  for (let i = 0; i < SPONSOR_NAMES.length; i++) {
    const s = SPONSOR_NAMES[i];
    const totalBudget = Math.floor(25000 + Math.random() * 475000); // 25k to 500k INR
    const sponsor = await Sponsor.create({
      brandName: s.brand,
      contactName: s.contact,
      email: `sponsor.${s.brand.toLowerCase().replace(/[^a-z0-9]/g, '')}@partner.in`,
      category: s.category,
      logoUrl: `https://picsum.photos/seed/sponsor_${i}/200/200`,
      website: s.web,
      totalBudget,
      spentBudget: 0,
      status: 'active'
    });
    createdSponsors.push(sponsor);
  }
  console.log(`✓ Seeded ${createdSponsors.length} Sponsors`);

  // 5. Create 80 Products
  const createdProducts = [];
  for (let i = 0; i < 80; i++) {
    const sponsor = createdSponsors[i % createdSponsors.length];
    const price = Math.floor(299 + Math.random() * 9700);
    const discountPrice = Math.random() > 0.3 ? Math.floor(price * (0.6 + Math.random() * 0.3)) : null;

    const product = await Product.create({
      sponsorId: sponsor._id,
      title: `${sponsor.brandName} Premium Series ${i + 1}`,
      description: `High performance, top-rated product in ${sponsor.category} designed for Indian consumers with high quality durability and sleek modern aesthetics.`,
      images: [
        `https://picsum.photos/seed/prod_${i}_1/600/600`,
        `https://picsum.photos/seed/prod_${i}_2/600/600`
      ],
      category: sponsor.category,
      price,
      discountPrice,
      availability: i % 15 === 0 ? 'limited' : 'in_stock',
      productUrl: `${sponsor.website}/products/item-${i + 1}`,
      tags: [sponsor.category.toLowerCase(), 'trending', 'verified', 'bestseller']
    });
    createdProducts.push(product);
  }
  console.log(`✓ Seeded ${createdProducts.length} Products`);

  // 6. Create 60 Campaigns
  // Types: AD_VIEW (24), PROMOTE (14), REFERRAL (14), DEAL (8)
  const createdCampaigns = [];
  const campaignTypes = ['AD_VIEW', 'PROMOTE', 'REFERRAL', 'DEAL'];

  for (let i = 0; i < 60; i++) {
    const sponsor = createdSponsors[i % createdSponsors.length];
    const product = createdProducts[i % createdProducts.length];
    const type = i < 24 ? 'AD_VIEW' : i < 38 ? 'PROMOTE' : i < 52 ? 'REFERRAL' : 'DEAL';

    let rewardAmount = 5;
    if (type === 'AD_VIEW') rewardAmount = Math.floor(2 + (i % 7)); // Rs 2 to 8
    else if (type === 'PROMOTE') rewardAmount = Math.floor(10 + (i % 31)); // Rs 10 to 40
    else if (type === 'REFERRAL') rewardAmount = Math.floor(15 + (i % 36)); // Rs 15 to 50
    else if (type === 'DEAL') rewardAmount = Math.floor(5 + (i % 16)); // Rs 5 to 20

    const videoChoice = SAMPLE_VIDEOS[i % SAMPLE_VIDEOS.length];
    const totalBudget = Math.floor(10000 + (i * 1500));
    const status = i === 58 ? 'paused' : i === 59 ? 'ended' : 'active';

    const campaign = await Campaign.create({
      sponsorId: sponsor._id,
      productId: product._id,
      title: `${sponsor.brandName} - ${type === 'AD_VIEW' ? 'Discover New' : type === 'PROMOTE' ? 'Share & Promote' : type === 'REFERRAL' ? 'Invite & Earn' : 'Exclusive Deal on'} ${product.title}`,
      description: `Participate in this official ${sponsor.brandName} campaign. Experience quality and earn verified simulated rewards directly into your platform wallet.`,
      type,
      videoUrl: videoChoice.url,
      thumbnailUrl: videoChoice.poster,
      durationSec: videoChoice.duration,
      rewardAmount,
      totalBudget,
      spentBudget: 0,
      maxParticipantsPerUser: 1,
      maxTotalRewards: 500,
      startDate: new Date(Date.now() - 15 * 86400000),
      endDate: new Date(Date.now() + 45 * 86400000),
      status,
      autoApprove: type === 'AD_VIEW',
      requirements: {
        text: type === 'AD_VIEW'
          ? 'Watch at least 90% of the video ad without skipping.'
          : type === 'PROMOTE'
          ? 'Share link on Instagram, WhatsApp or Twitter and upload a screenshot proof.'
          : type === 'REFERRAL'
          ? 'Generate your link and refer at least 1 verified visitor.'
          : 'Unlock deal code and make a qualifying store checkout.',
        evidenceType: type === 'PROMOTE' ? 'screenshot' : type === 'REFERRAL' ? 'url' : 'none'
      },
      termsAndConditions: 'Prototype - simulated rewards. Subject to verification and campaign budget.'
    });
    createdCampaigns.push(campaign);
  }
  console.log(`✓ Seeded ${createdCampaigns.length} Campaigns`);

  // 7. Seed 85 Referral Links
  const createdReferralLinks = [];
  for (let i = 0; i < 85; i++) {
    const user = createdUsers[i % createdUsers.length];
    const campaign = createdCampaigns[i % createdCampaigns.length];
    const product = createdProducts[i % createdProducts.length];
    const code = `REF-${user.referralCode.slice(4)}-${100 + i}`;
    const clicks = Math.floor(5 + Math.random() * 95);
    const uniqueVisits = Math.floor(clicks * (0.4 + Math.random() * 0.4));
    const qualifyingActions = Math.floor(uniqueVisits * (0.05 + Math.random() * 0.2));

    const link = await ReferralLink.create({
      userId: user._id,
      campaignId: campaign._id,
      productId: product._id,
      code,
      url: `http://localhost:5000/api/r/${code}`,
      clicks,
      uniqueVisits,
      qualifyingActions
    });
    createdReferralLinks.push(link);
  }
  console.log(`✓ Seeded ${createdReferralLinks.length} Referral Links`);

  // 8. Seed 320 AdViews
  const adCampaigns = createdCampaigns.filter(c => c.type === 'AD_VIEW');
  const createdAdViews = [];

  for (let i = 0; i < 320; i++) {
    const user = createdUsers[i % createdUsers.length];
    const campaign = adCampaigns[i % adCampaigns.length];
    const isCompleted = i < 240; // 240 completed, 80 in progress/abandoned
    const isFlagged = i === 13 || i === 47 || i === 88;

    const watchedSeconds = isCompleted ? campaign.durationSec : Math.floor(campaign.durationSec * 0.4);
    const watchPercent = Math.min(100, Math.round((watchedSeconds / campaign.durationSec) * 100));

    const heartbeats = [
      { timestamp: new Date(Date.now() - 7200000 + i * 10000), currentTime: 0, cumulativePlayedSeconds: 0 },
      { timestamp: new Date(Date.now() - 7200000 + i * 10000 + 4000), currentTime: 4, cumulativePlayedSeconds: 4 },
      { timestamp: new Date(Date.now() - 7200000 + i * 10000 + 8000), currentTime: 8, cumulativePlayedSeconds: 8 },
      { timestamp: new Date(Date.now() - 7200000 + i * 10000 + 12000), currentTime: 12, cumulativePlayedSeconds: 12 },
      { timestamp: new Date(Date.now() - 7200000 + i * 10000 + 15000), currentTime: 15, cumulativePlayedSeconds: 15 }
    ];

    const adView = await AdView.create({
      userId: user._id,
      campaignId: campaign._id,
      watchedSeconds,
      videoDurationSec: campaign.durationSec,
      watchPercent,
      completed: isCompleted && !isFlagged,
      heartbeats: isCompleted ? heartbeats : heartbeats.slice(0, 2),
      startedAt: new Date(Date.now() - 7200000 + i * 10000),
      endedAt: isCompleted ? new Date(Date.now() - 7200000 + i * 10000 + 16000) : null,
      ipAddress: `49.36.128.${(i % 120) + 1}`,
      userAgent: 'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 Chrome/124.0.0.0 Mobile Safari/537.36',
      flagged: isFlagged,
      flagReason: isFlagged ? 'Playback skipped ahead unnaturally' : ''
    });
    createdAdViews.push(adView);
  }
  console.log(`✓ Seeded ${createdAdViews.length} AdViews`);

  // 9. Seed 110 Activities (promotional submissions)
  const promoCampaigns = createdCampaigns.filter(c => c.type === 'PROMOTE' || c.type === 'REFERRAL');
  const createdActivities = [];

  for (let i = 0; i < 110; i++) {
    const user = createdUsers[i % createdUsers.length];
    const campaign = promoCampaigns[i % promoCampaigns.length];
    const status = i < 55 ? 'approved' : i < 85 ? 'submitted' : 'rejected';
    const link = createdReferralLinks[i % createdReferralLinks.length];

    const activity = await Activity.create({
      userId: user._id,
      campaignId: campaign._id,
      type: campaign.type,
      evidenceUrl: `https://picsum.photos/seed/evidence_${i}/800/600`,
      evidenceText: `Shared campaign link on personal WhatsApp status and Instagram story with ${150 + i * 10} views. High engagement generated.`,
      referralLinkId: link._id,
      status,
      reviewedBy: status !== 'submitted' ? adminUser._id : null,
      decisionReason:
        status === 'approved'
          ? 'Valid promotional proof verified. High quality engagement.'
          : status === 'rejected'
          ? 'Invalid or blurred screenshot. Campaign link not clearly visible.'
          : ''
    });
    createdActivities.push(activity);
  }
  console.log(`✓ Seeded ${createdActivities.length} Promotional Activities`);

  // 10. Seed 165 Rewards in all three states + Transactions + Internal Consistency
  const userEarningsMap = new Map();
  const userPendingMap = new Map();
  const campaignSpentMap = new Map();
  const sponsorSpentMap = new Map();

  // Helper trackers
  const recordApproval = (userId, campaignId, amount) => {
    userEarningsMap.set(userId.toString(), (userEarningsMap.get(userId.toString()) || 0) + amount);
    campaignSpentMap.set(campaignId.toString(), (campaignSpentMap.get(campaignId.toString()) || 0) + amount);
  };
  const recordPending = (userId, amount) => {
    userPendingMap.set(userId.toString(), (userPendingMap.get(userId.toString()) || 0) + amount);
  };

  const createdRewards = [];
  const createdTransactions = [];

  // A. Generate rewards for completed AdViews (first 90 distinct user-campaign pairs)
  const adViewRewards = [];
  const seenAdViewPairs = new Set();

  for (const av of createdAdViews) {
    if (!av.completed || av.flagged) continue;
    const key = `${av.userId.toString()}_${av.campaignId.toString()}`;
    if (seenAdViewPairs.has(key)) continue;
    seenAdViewPairs.add(key);

    const campaign = createdCampaigns.find(c => c._id.toString() === av.campaignId.toString());
    if (!campaign) continue;

    const reward = await Reward.create({
      userId: av.userId,
      campaignId: av.campaignId,
      sourceType: 'AD_VIEW',
      sourceId: av._id,
      amount: campaign.rewardAmount,
      status: 'approved',
      reason: 'Auto-approved on meeting 90% watch threshold',
      decidedBy: adminUser._id,
      decidedAt: new Date(Date.now() - 43200000)
    });

    av.rewardId = reward._id;
    await av.save();

    recordApproval(av.userId, av.campaignId, campaign.rewardAmount);
    createdRewards.push(reward);
    adViewRewards.push(reward);

    if (adViewRewards.length >= 85) break;
  }

  // B. Generate rewards for Activities (matching the 110 activities)
  for (const act of createdActivities) {
    const campaign = createdCampaigns.find(c => c._id.toString() === act.campaignId.toString());
    if (!campaign) continue;

    let reason = '';
    if (act.status === 'approved') reason = 'Verified by administrator: Valid promotional evidence';
    else if (act.status === 'rejected') reason = act.decisionReason;
    else reason = 'Submitted promotional activity evidence';

    const reward = await Reward.create({
      userId: act.userId,
      campaignId: act.campaignId,
      sourceType: act.type,
      sourceId: act._id,
      amount: campaign.rewardAmount,
      status: act.status === 'submitted' ? 'pending' : act.status,
      reason,
      decidedBy: act.status !== 'submitted' ? adminUser._id : null,
      decidedAt: act.status !== 'submitted' ? new Date() : null
    });

    createdRewards.push(reward);

    if (act.status === 'approved') {
      recordApproval(act.userId, act.campaignId, campaign.rewardAmount);
    } else if (act.status === 'submitted') {
      recordPending(act.userId, campaign.rewardAmount);
    }
  }
  console.log(`✓ Seeded ${createdRewards.length} Rewards (approved, pending, rejected)`);

  // Create Transactions for all approved rewards
  for (const rew of createdRewards) {
    if (rew.status !== 'approved') continue;

    const currentBal = userEarningsMap.get(rew.userId.toString()) || rew.amount;
    const tx = await Transaction.create({
      userId: rew.userId,
      rewardId: rew._id,
      type: 'credit',
      amount: rew.amount,
      balanceAfter: currentBal,
      note: `Approved reward for campaign activity (${rew.sourceType})`,
      createdAt: rew.decidedAt || rew.createdAt
    });
    createdTransactions.push(tx);
  }

  // Add 15 simulated withdrawals for users with good balances
  for (let i = 0; i < 15; i++) {
    const user = createdUsers[i];
    const earned = userEarningsMap.get(user._id.toString()) || 0;
    if (earned >= env.MIN_WITHDRAWAL_AMOUNT) {
      const withdrawAmount = Math.min(earned, env.MIN_WITHDRAWAL_AMOUNT);
      const newBal = earned - withdrawAmount;
      userEarningsMap.set(user._id.toString(), newBal);

      const tx = await Transaction.create({
        userId: user._id,
        rewardId: null,
        type: 'withdrawal',
        amount: -withdrawAmount,
        balanceAfter: newBal,
        note: `Simulated withdrawal to UPI: ${user.phone}@upi`,
        createdAt: new Date()
      });
      createdTransactions.push(tx);
    }
  }
  console.log(`✓ Seeded ${createdTransactions.length} Transactions (credits and simulated withdrawals)`);

  // Update Users wallet balances with internal consistency
  for (const user of createdUsers) {
    const approved = userEarningsMap.get(user._id.toString()) || 0;
    const pending = userPendingMap.get(user._id.toString()) || 0;

    user.walletBalance = approved;
    user.pendingBalance = pending;
    user.totalEarned = approved;
    await user.save();
  }

  // Update Campaigns spentBudget and aggregate to Sponsors
  for (const camp of createdCampaigns) {
    const spent = campaignSpentMap.get(camp._id.toString()) || 0;
    camp.spentBudget = spent;
    await camp.save();

    const spId = camp.sponsorId.toString();
    sponsorSpentMap.set(spId, (sponsorSpentMap.get(spId) || 0) + spent);
  }

  for (const sp of createdSponsors) {
    const spent = sponsorSpentMap.get(sp._id.toString()) || 0;
    sp.spentBudget = spent;
    await sp.save();
  }
  console.log('✓ Synchronized and verified wallet balances and sponsor budgets');

  // 11. Seed 45 Coupons / Deals (some active, some expired)
  const createdCoupons = [];
  for (let i = 0; i < 45; i++) {
    const sponsor = createdSponsors[i % createdSponsors.length];
    const product = createdProducts[i % createdProducts.length];
    const isExpired = i % 4 === 0; // 25% expired
    const discountType = i % 2 === 0 ? 'percent' : 'fixed';
    const discountValue = discountType === 'percent' ? Math.floor(10 + Math.random() * 40) : Math.floor(100 + Math.random() * 500);

    const expiryDate = isExpired
      ? new Date(Date.now() - (5 + (i % 20)) * 86400000) // past
      : new Date(Date.now() + (10 + (i % 30)) * 86400000); // future

    const coupon = await Coupon.create({
      sponsorId: sponsor._id,
      productId: product._id,
      title: `${discountValue}${discountType === 'percent' ? '% OFF' : ' INR OFF'} on ${product.title}`,
      code: `${sponsor.brandName.slice(0, 4).toUpperCase().replace(/[^A-Z]/g, 'SALE')}${discountValue}${i + 1}`,
      discountType,
      discountValue,
      minPurchase: discountType === 'percent' ? 499 : 999,
      expiryDate,
      restrictions: 'Valid on single purchase per user. Cannot be clubbed with other offers.',
      originalPrice: product.price,
      status: isExpired ? 'expired' : 'active'
    });
    createdCoupons.push(coupon);
  }
  console.log(`✓ Seeded ${createdCoupons.length} Deals & Coupons (including expired)`);

  // Seed 40 Coupon Redemptions
  for (let i = 0; i < 40; i++) {
    const user = createdUsers[i % createdUsers.length];
    const coupon = createdCoupons[i % createdCoupons.length];
    await CouponRedemption.create({
      userId: user._id,
      couponId: coupon._id,
      status: i % 2 === 0 ? 'redeemed' : 'revealed',
      redeemedAt: new Date(Date.now() - i * 3600000)
    });
  }
  console.log('✓ Seeded 40 Coupon Redemptions');

  // 12. Seed 210 AuditLog entries
  const auditLogs = [];
  auditLogs.push({
    actorId: adminUser._id,
    action: 'ADMIN_PLATFORM_INITIALIZED',
    entityType: 'System',
    entityId: adminUser._id,
    meta: { version: '1.0.0', initializedAt: new Date() }
  });

  for (let i = 0; i < 70; i++) {
    auditLogs.push({
      actorId: adminUser._id,
      action: i % 3 === 0 ? 'REWARD_APPROVED' : i % 3 === 1 ? 'ACTIVITY_APPROVED' : 'ACTIVITY_REJECTED',
      entityType: 'Reward',
      entityId: createdRewards[i % createdRewards.length]._id,
      meta: { decisionReason: 'Verified by administrator in queue', verifiedAt: new Date() }
    });
  }

  for (let i = 0; i < 40; i++) {
    auditLogs.push({
      actorId: createdUsers[i]._id,
      action: 'USER_REGISTERED',
      entityType: 'User',
      entityId: createdUsers[i]._id,
      meta: { email: createdUsers[i].email, referralCode: createdUsers[i].referralCode }
    });
  }

  for (let i = 0; i < 10; i++) {
    auditLogs.push({
      actorId: adminUser._id,
      action: 'USER_SUSPENDED',
      entityType: 'User',
      entityId: createdUsers[i * 4]._id,
      meta: { reason: 'Suspicious heartbeat velocity flagged by system' }
    });
  }

  await AuditLog.insertMany(auditLogs);
  console.log(`✓ Seeded ${auditLogs.length} AuditLog entries`);

  // Summary Table
  console.log('\n====================================================');
  console.log('DATABASE SEEDING COMPLETE - SUMMARY TABLE');
  console.log('====================================================');
  console.table({
    Admins: 1,
    Users: createdUsers.length,
    Sponsors: createdSponsors.length,
    Products: createdProducts.length,
    Campaigns: createdCampaigns.length,
    AdViews: createdAdViews.length,
    Activities: createdActivities.length,
    ReferralLinks: createdReferralLinks.length,
    Rewards: createdRewards.length,
    Transactions: createdTransactions.length,
    Coupons: createdCoupons.length,
    AuditLogs: auditLogs.length
  });

  console.log('\n====================================================');
  console.log('DEMO CREDENTIALS');
  console.log('====================================================');
  console.log('ADMIN:');
  console.log(`  Email:    ${env.ADMIN_SEED_EMAIL}`);
  console.log(`  Password: ${env.ADMIN_SEED_PASSWORD}\n`);

  console.log('SAMPLE USERS (Password for all: "User@12345"):');
  console.log(`  User 1:   ${createdUsers[0].email} (Balance: ₹${createdUsers[0].walletBalance})`);
  console.log(`  User 2:   ${createdUsers[1].email} (Balance: ₹${createdUsers[1].walletBalance})`);
  console.log(`  User 3:   ${createdUsers[2].email} (Balance: ₹${createdUsers[2].walletBalance})`);
  console.log(`  User Suspended: ${createdUsers[12].email} (Status: suspended)`);
  console.log('====================================================\n');

  await disconnectDB();
};

// Auto-run if executed directly
if (process.argv[1].endsWith('seed.js')) {
  seedDatabase()
    .then(() => {
      console.log('Seed completed successfully.');
      process.exit(0);
    })
    .catch((err) => {
      console.error('Seed failed:', err);
      process.exit(1);
    });
}
