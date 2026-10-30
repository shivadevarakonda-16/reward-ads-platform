import mongoose from 'mongoose';
import { connectDB, disconnectDB } from '../config/db.js';
import { Campaign } from '../models/Campaign.js';

const LOCAL_VIDEOS = [
  '/videos/ad1.mp4',
  '/videos/ad2.mp4',
  '/videos/ad3.mp4',
  '/videos/ad4.mp4',
  '/videos/ad5.mp4',
  '/videos/ad6.mp4'
];

async function updateCampaignVideos() {
  try {
    await connectDB();
    console.log('[UpdateVideos] Connected to DB. Scanning campaigns...');

    const campaigns = await Campaign.find({});
    console.log(`[UpdateVideos] Found ${campaigns.length} total campaigns.`);

    let updatedCount = 0;
    for (let i = 0; i < campaigns.length; i++) {
      const camp = campaigns[i];
      const videoToUse = LOCAL_VIDEOS[i % LOCAL_VIDEOS.length];
      if (camp.videoUrl !== videoToUse) {
        camp.videoUrl = videoToUse;
        await camp.save();
        updatedCount++;
      }
    }

    console.log(`[UpdateVideos] Successfully updated ${updatedCount} campaigns to use local high-reliability video streams.`);
  } catch (err) {
    console.error('[UpdateVideos] Error:', err);
  } finally {
    await disconnectDB();
    console.log('[UpdateVideos] Done.');
  }
}

updateCampaignVideos();
