const BASE_URL = 'http://127.0.0.1:5000/api';

const api = async (endpoint, options = {}) => {
  const url = `${BASE_URL}${endpoint}`;
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {})
  };

  const config = {
    method: options.method || 'GET',
    headers,
    redirect: options.redirect || 'follow'
  };

  if (options.body) {
    config.body = JSON.stringify(options.body);
  }

  const res = await fetch(url, config);
  const data = await res.json().catch(() => ({}));
  return { status: res.status, ok: res.ok, data };
};

const runTests = async () => {
  console.log('====================================================');
  console.log('STARTING END-TO-END VERIFICATION TEST SUITE');
  console.log('====================================================\n');

  let passed = 0;
  let failed = 0;

  const assert = (condition, message) => {
    if (condition) {
      console.log(`  ✓ PASS: ${message}`);
      passed++;
    } else {
      console.error(`  ✗ FAIL: ${message}`);
      failed++;
    }
  };

  try {
    // ----------------------------------------------------
    // TEST 1: User Registration
    // ----------------------------------------------------
    console.log('1. Testing User Registration & Referral Attribution...');
    const testEmail = `test.user.${Date.now()}@rewardads.test`;
    const regRes = await api('/auth/register', {
      method: 'POST',
      body: {
        name: 'Test Journey User',
        email: testEmail,
        password: 'User@12345',
        phone: '+91 9999999999',
        referralCode: 'USR-AAR100' // from seeded user
      }
    });
    assert(regRes.data.success && regRes.data.token, 'User registered successfully and received JWT');
    const userToken = regRes.data.token;
    const testUserId = regRes.data.user._id;

    // ----------------------------------------------------
    // TEST 2: Admin Login
    // ----------------------------------------------------
    console.log('\n2. Testing Admin Login & Role Guard...');
    const adminLoginRes = await api('/auth/login', {
      method: 'POST',
      body: {
        email: 'admin@rewardads.test',
        password: 'Admin@12345'
      }
    });
    assert(adminLoginRes.data.success && adminLoginRes.data.user.role === 'admin', 'Admin authenticated with admin role');
    const adminToken = adminLoginRes.data.token;

    // Verify non-admin blocked from admin route
    const blockedRes = await api('/admin/stats', {
      headers: { Authorization: `Bearer ${userToken}` }
    });
    assert(blockedRes.status === 403, 'Non-admin correctly denied with HTTP 403');

    // Verify admin allowed into admin route
    const adminStatsRes = await api('/admin/stats', {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    assert(adminStatsRes.data.success && adminStatsRes.data.kpis.totalUsers >= 60, 'Admin successfully retrieved platform KPIs');

    // ----------------------------------------------------
    // TEST 3: Reels Feed Retrieval
    // ----------------------------------------------------
    console.log('\n3. Testing Reels Feed Retrieval...');
    const feedRes = await api('/campaigns/feed?limit=5', {
      headers: { Authorization: `Bearer ${userToken}` }
    });
    assert(feedRes.data.success && feedRes.data.data.length > 0, 'Reels feed returned active video ad campaigns');
    const targetCampaign = feedRes.data.data[0];
    assert(targetCampaign.type === 'AD_VIEW', `Feed campaign is AD_VIEW type (id: ${targetCampaign._id})`);

    // ----------------------------------------------------
    // TEST 4: Watch & Earn Lifecycle (Start -> Heartbeats -> End -> Reward)
    // ----------------------------------------------------
    console.log('\n4. Testing Server-Validated Watch & Earn Flow...');
    const duration = targetCampaign.durationSec || 15;
    const simulatedStartTime = Date.now() - (duration + 2) * 1000;

    const startRes = await api('/adviews/start', {
      method: 'POST',
      body: {
        campaignId: targetCampaign._id,
        videoDurationSec: duration,
        clientTimestamp: new Date(simulatedStartTime).toISOString()
      },
      headers: { Authorization: `Bearer ${userToken}` }
    });
    assert(startRes.data.success && startRes.data.adViewId, `Ad view session started: ${startRes.data.adViewId}`);
    const adViewId = startRes.data.adViewId;

    // Send heartbeats spaced 2 seconds apart matching video duration
    for (let sec = 2; sec <= duration; sec += 2) {
      const hbTime = simulatedStartTime + sec * 1000;
      const hbRes = await api(`/adviews/${adViewId}/heartbeat`, {
        method: 'POST',
        body: {
          currentTime: sec,
          cumulativePlayedSeconds: sec,
          clientTimestamp: new Date(hbTime).toISOString()
        },
        headers: { Authorization: `Bearer ${userToken}` }
      });
      assert(hbRes.data.success, `Heartbeat at ${sec}s accepted, watchPercent: ${hbRes.data.watchPercent}%`);
    }

    // Call End Ad View at completion
    const endRes = await api(`/adviews/${adViewId}/end`, {
      method: 'POST',
      body: {
        currentTime: duration,
        cumulativePlayedSeconds: duration,
        clientTimestamp: new Date(simulatedStartTime + duration * 1000).toISOString()
      },
      headers: { Authorization: `Bearer ${userToken}` }
    });
    assert(endRes.data.success && endRes.data.completed, 'Ad view ended and marked completed');
    assert(endRes.data.reward && endRes.data.reward.amount === targetCampaign.rewardAmount, `Reward created with amount ₹${targetCampaign.rewardAmount}`);

    // Verify user wallet updated
    const walletRes = await api('/wallet', {
      headers: { Authorization: `Bearer ${userToken}` }
    });
    assert(walletRes.data.wallet.balance >= targetCampaign.rewardAmount, `Wallet balance updated to ₹${walletRes.data.wallet.balance}`);

    // ----------------------------------------------------
    // TEST 5: Duplicate Reward Claim Prevention
    // ----------------------------------------------------
    console.log('\n5. Testing Duplicate Ad Reward Claim Prevention...');
    const dupStartRes = await api('/adviews/start', {
      method: 'POST',
      body: { campaignId: targetCampaign._id, videoDurationSec: duration },
      headers: { Authorization: `Bearer ${userToken}` }
    });
    const dupAdViewId = dupStartRes.data.adViewId;

    await api(`/adviews/${dupAdViewId}/heartbeat`, {
      method: 'POST',
      body: { currentTime: duration, cumulativePlayedSeconds: duration },
      headers: { Authorization: `Bearer ${userToken}` }
    });

    const dupEndRes = await api(`/adviews/${dupAdViewId}/end`, {
      method: 'POST',
      body: { currentTime: duration, cumulativePlayedSeconds: duration },
      headers: { Authorization: `Bearer ${userToken}` }
    });
    assert(
      dupEndRes.data.reward === null || dupEndRes.data.rewardError?.includes('already been rewarded'),
      'Server prevented duplicate reward on same ad campaign'
    );

    // ----------------------------------------------------
    // TEST 6: Referral Link Generation & Visit Tracking
    // ----------------------------------------------------
    console.log('\n6. Testing Referral Tracking & Daily IP Deduplication...');
    const linkGenRes = await api('/referrals/generate', {
      method: 'POST',
      body: { campaignId: targetCampaign._id },
      headers: { Authorization: `Bearer ${userToken}` }
    });
    assert(linkGenRes.data.success && linkGenRes.data.data.code, `Referral link created with code: ${linkGenRes.data.data.code}`);
    const refCode = linkGenRes.data.data.code;

    // Simulate 2 visits to /r/:code
    await api(`/r/${refCode}`, { redirect: 'manual' });
    await api(`/r/${refCode}`, { redirect: 'manual' });

    const myRefsRes = await api('/referrals/mine', {
      headers: { Authorization: `Bearer ${userToken}` }
    });
    const foundLink = myRefsRes.data.data.find(l => l.code === refCode);
    assert(foundLink && foundLink.clicks >= 2, `Total clicks registered: ${foundLink?.clicks}`);
    assert(foundLink && foundLink.uniqueVisits === 1, `Daily unique visits correctly deduplicated to 1 (got: ${foundLink?.uniqueVisits})`);

    // ----------------------------------------------------
    // TEST 7: Promotional Activity Submission & Admin Approval Queue
    // ----------------------------------------------------
    console.log('\n7. Testing Activity Submission & Admin Decision Queue...');
    const allCampsRes = await api('/campaigns?type=PROMOTE&limit=1');
    const promoCamp = allCampsRes.data.data[0];

    const actSubmitRes = await api('/activities', {
      method: 'POST',
      body: {
        campaignId: promoCamp._id,
        type: 'PROMOTE',
        evidenceUrl: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff',
        evidenceText: 'Shared on Instagram story with 200 views. Verified link attached.'
      },
      headers: { Authorization: `Bearer ${userToken}` }
    });
    assert(actSubmitRes.data.success && actSubmitRes.data.activity.status === 'submitted', 'Activity submitted into pending queue');
    const activityId = actSubmitRes.data.activity._id;

    // Admin approves with required reason
    const approveRes = await api(`/admin/activities/${activityId}/decision`, {
      method: 'PATCH',
      body: {
        decision: 'approved',
        reason: 'Valid Instagram story proof verified by admin'
      },
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    assert(approveRes.data.success && approveRes.data.activity.status === 'approved', 'Admin approved activity with required reason');

    // ----------------------------------------------------
    // TEST 8: Simulated Wallet Withdrawal
    // ----------------------------------------------------
    console.log('\n8. Testing Simulated Wallet Withdrawal...');
    // Rejection of amount below minimum (100)
    const rejectWithdrawRes = await api('/wallet/withdraw', {
      method: 'POST',
      body: { amount: 10, paymentMethod: 'UPI', accountDetails: 'user@upi' },
      headers: { Authorization: `Bearer ${userToken}` }
    });
    assert(rejectWithdrawRes.status === 400 || !rejectWithdrawRes.ok, 'Withdrawal below minimum ₹100 rejected as expected');

    // Test successful withdrawal using a seeded user with sufficient balance
    // First, let's find a user with balance >= 100 or give test user sufficient reward
    const bonusApprove = await api('/admin/rewards', {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    // Create an approved reward of ₹150 for test user so we can test full withdrawal
    const bonusCampRes = await api('/admin/campaigns', {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    const bonusCamp = bonusCampRes.data.data[0];

    // Submit and approve an activity with high reward to test withdrawal
    const bigActRes = await api('/activities', {
      method: 'POST',
      body: {
        campaignId: bonusCamp._id,
        type: 'PROMOTE',
        evidenceText: 'Major promotional influencer campaign'
      },
      headers: { Authorization: `Bearer ${userToken}` }
    });
    if (bigActRes.data.activity) {
      await api(`/admin/activities/${bigActRes.data.activity._id}/decision`, {
        method: 'PATCH',
        body: { decision: 'approved', reason: 'High impact influencer promotion verified' },
        headers: { Authorization: `Bearer ${adminToken}` }
      });
    }

    // Check user balance again
    const postBonusWallet = await api('/wallet', {
      headers: { Authorization: `Bearer ${userToken}` }
    });
    console.log(`  -> Current test user balance: ₹${postBonusWallet.data.wallet.balance}`);

    // If balance >= 100, execute withdrawal; otherwise test with a user who has balance
    let withdrawToken = userToken;
    let availableBal = postBonusWallet.data.wallet.balance;

    if (availableBal < 100) {
      // Find a user from admin user directory who has balance >= 100
      const adminUsersList = await api('/admin/users?limit=50', {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      const richUser = adminUsersList.data.data.find(u => u.walletBalance >= 100 && u.status === 'active');
      if (richUser) {
        const richLogin = await api('/auth/login', {
          method: 'POST',
          body: { email: richUser.email, password: 'User@12345' }
        });
        withdrawToken = richLogin.data.token;
        availableBal = richUser.walletBalance;
      }
    }

    if (availableBal >= 100) {
      const withdrawRes = await api('/wallet/withdraw', {
        method: 'POST',
        body: { amount: 100, paymentMethod: 'UPI', accountDetails: 'shiva@oksbi' },
        headers: { Authorization: `Bearer ${withdrawToken}` }
      });
      assert(withdrawRes.data.success && withdrawRes.data.transaction, `Withdrawal of ₹100 successfully processed, new balance: ₹${withdrawRes.data.newBalance}`);
    } else {
      console.log('  -> Note: All users below ₹100 threshold, minimum enforcement verified.');
    }

    // ----------------------------------------------------
    // TEST 9: Coupon Redemption & Expired Coupon Check
    // ----------------------------------------------------
    console.log('\n9. Testing Coupon Redemption & Expired Coupon Rejection...');
    const allDeals = await api('/deals?limit=50');
    const expiredDeal = allDeals.data.data.find(d => d.isExpired);
    const activeDeal = allDeals.data.data.find(d => !d.isExpired);

    assert(expiredDeal !== undefined, 'Found at least one expired deal in catalog');
    assert(activeDeal !== undefined, 'Found at least one active deal in catalog');

    // Attempting to redeem expired coupon should fail with 400
    const expiredRedeemRes = await api(`/deals/${expiredDeal._id}/redeem`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${userToken}` }
    });
    assert(expiredRedeemRes.status === 400, 'Expired deal redemption correctly rejected with HTTP 400');

    // Redeeming active coupon should succeed and return code
    const activeRedeemRes = await api(`/deals/${activeDeal._id}/redeem`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${userToken}` }
    });
    assert(activeRedeemRes.data.success && activeRedeemRes.data.code, `Active deal redeemed successfully, code: ${activeRedeemRes.data.code}`);

    // ----------------------------------------------------
    // TEST 10: Fraud Detection (Impossibly fast heartbeats)
    // ----------------------------------------------------
    console.log('\n10. Testing Fraud Detection (Skipping / Velocity Abuse)...');
    const fraudStartRes = await api('/adviews/start', {
      method: 'POST',
      body: { campaignId: targetCampaign._id, videoDurationSec: 15 },
      headers: { Authorization: `Bearer ${userToken}` }
    });
    const fraudViewId = fraudStartRes.data.adViewId;

    // Send fraudulent jump: from 0s to 14s in immediate call
    const fraudHbRes = await api(`/adviews/${fraudViewId}/heartbeat`, {
      method: 'POST',
      body: { currentTime: 14, cumulativePlayedSeconds: 14 },
      headers: { Authorization: `Bearer ${userToken}` }
    });
    assert(fraudHbRes.data.flagged === true, 'Fraud engine flagged unnatural video jump');

    // Admin views fraud logs
    const fraudLogsRes = await api('/admin/fraud', {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    assert(fraudLogsRes.data.success && fraudLogsRes.data.flaggedViews.length > 0, 'Flagged ad view is visible in Admin Fraud & Security Sentinel');

  } catch (error) {
    console.error('Test Suite encountered an unexpected error:', error);
    failed++;
  }

  console.log('\n====================================================');
  console.log(`TEST SUITE RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log('====================================================\n');
  process.exit(failed > 0 ? 1 : 0);
};

runTests();
