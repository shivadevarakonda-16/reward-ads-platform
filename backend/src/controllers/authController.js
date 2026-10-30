import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';
import { env } from '../config/env.js';
import { ReferralService } from '../services/referralService.js';
import { AuditLog } from '../models/AuditLog.js';

export const register = async (req, res, next) => {
  try {
    const { name, email, password, phone, referralCode, deviceFingerprint } = req.body;

    // Check if user exists
    const existing = await User.findOne({ email: email.toLowerCase().trim() });
    if (existing) {
      return res.status(409).json({
        success: false,
        error: 'An account with this email address already exists.'
      });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Look up referrer if referral code provided
    let referredBy = null;
    if (referralCode && referralCode.trim()) {
      const referrer = await User.findOne({ referralCode: referralCode.trim().toUpperCase() });
      if (referrer) {
        referredBy = referrer._id;
      }
    }

    // Generate unique referral code for new user
    let userReferralCode = ReferralService.generateCode('USR');
    while (await User.findOne({ referralCode: userReferralCode })) {
      userReferralCode = ReferralService.generateCode('USR');
    }

    const newUser = await User.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      passwordHash,
      phone: phone || '',
      referralCode: userReferralCode,
      referredBy,
      deviceFingerprint: deviceFingerprint || '',
      walletBalance: 0,
      pendingBalance: 0,
      totalEarned: 0,
      role: 'user',
      status: 'active'
    });

    // Generate JWT
    const token = jwt.sign(
      { id: newUser._id, role: newUser.role, email: newUser.email },
      env.JWT_SECRET,
      { expiresIn: env.JWT_EXPIRES_IN }
    );

    await AuditLog.create({
      actorId: newUser._id,
      action: 'USER_REGISTERED',
      entityType: 'User',
      entityId: newUser._id,
      meta: { email: newUser.email, referredBy }
    });

    return res.status(201).json({
      success: true,
      message: 'Registration successful',
      token,
      user: newUser
    });
  } catch (error) {
    next(error);
  }
};

export const login = async (req, res, next) => {
  try {
    const { email, password, deviceFingerprint } = req.body;

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Invalid email or password.'
      });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        error: 'Invalid email or password.'
      });
    }

    if (user.status === 'suspended') {
      return res.status(403).json({
        success: false,
        error: 'Your account has been suspended due to policy violations. Contact support.'
      });
    }

    // Update fingerprint if provided
    if (deviceFingerprint && deviceFingerprint !== user.deviceFingerprint) {
      user.deviceFingerprint = deviceFingerprint;
      await user.save();
    }

    const token = jwt.sign(
      { id: user._id, role: user.role, email: user.email },
      env.JWT_SECRET,
      { expiresIn: env.JWT_EXPIRES_IN }
    );

    return res.json({
      success: true,
      message: 'Login successful',
      token,
      user
    });
  } catch (error) {
    next(error);
  }
};

export const getMe = async (req, res, next) => {
  try {
    return res.json({
      success: true,
      user: req.user
    });
  } catch (error) {
    next(error);
  }
};
