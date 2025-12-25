import { storage } from "./storage";
import crypto from "crypto";

export type ViolationType = 
  | 'devtools' 
  | 'screen_share' 
  | 'tab_switch' 
  | 'copy_attempt' 
  | 'right_click'
  | 'keyboard_shortcut'
  | 'suspicious_behavior';

export type BanType = 'temporary' | 'permanent';

interface ViolationConfig {
  severity: 'low' | 'medium' | 'high' | 'critical';
  banType: BanType;
  banDurationHours?: number;
  thresholdCount?: number;
}

const VIOLATION_CONFIG: Record<ViolationType, ViolationConfig> = {
  devtools: { severity: 'high', banType: 'temporary', banDurationHours: 24, thresholdCount: 5 },
  screen_share: { severity: 'critical', banType: 'temporary', banDurationHours: 72, thresholdCount: 2 },
  tab_switch: { severity: 'low', banType: 'temporary', banDurationHours: 1, thresholdCount: 10 },
  copy_attempt: { severity: 'medium', banType: 'temporary', banDurationHours: 6, thresholdCount: 5 },
  right_click: { severity: 'low', banType: 'temporary', banDurationHours: 1, thresholdCount: 15 },
  keyboard_shortcut: { severity: 'medium', banType: 'temporary', banDurationHours: 2, thresholdCount: 10 },
  suspicious_behavior: { severity: 'high', banType: 'temporary', banDurationHours: 48, thresholdCount: 10 },
};

const DAILY_WATCH_LIMIT_SECONDS = 3 * 60 * 60;
const MAX_PLAY_ATTEMPTS_PER_HOUR = 50;
const VIDEO_TOKEN_EXPIRY_SECONDS = 30 * 60;

export class SecurityService {
  
  async logViolation(
    userId: string,
    violationType: ViolationType,
    description?: string,
    movieId?: string,
    ipAddress?: string,
    userAgent?: string
  ) {
    const config = VIOLATION_CONFIG[violationType];
    
    const violation = await storage.createSecurityViolation({
      userId,
      violationType,
      severity: config.severity,
      description,
      movieId,
      ipAddress,
      userAgent,
    });

    console.log(`[Security] Violation logged: ${violationType} for user ${userId}, severity: ${config.severity}`);

    const recentViolations = await storage.getUserViolationCount(userId, violationType, 24);
    const threshold = config.thresholdCount || 1;
    
    if (recentViolations >= threshold) {
      await this.banUser(userId, config.banType, `Auto-ban: ${violationType} (${recentViolations} violations)`, violation.id, config.banDurationHours);
      return { banned: true, violation };
    }

    return { banned: false, violation };
  }

  async banUser(
    userId: string,
    banType: BanType,
    reason: string,
    violationId?: string,
    durationHours?: number
  ) {
    const now = Math.floor(Date.now() / 1000);
    const expiresAt = banType === 'temporary' && durationHours 
      ? now + (durationHours * 3600) 
      : null;

    await storage.createUserBan({
      userId,
      banType,
      reason,
      violationId,
      expiresAt,
      isActive: 1,
    });

    console.log(`[Security] User ${userId} banned: ${banType}, reason: ${reason}`);
  }

  async checkUserBan(userId: string): Promise<{ isBanned: boolean; ban?: any }> {
    const activeBan = await storage.getActiveUserBan(userId);
    
    if (!activeBan) {
      return { isBanned: false };
    }

    if (activeBan.banType === 'temporary' && activeBan.expiresAt) {
      const now = Math.floor(Date.now() / 1000);
      if (now > activeBan.expiresAt) {
        await storage.deactivateUserBan(activeBan.id);
        return { isBanned: false };
      }
    }

    return { isBanned: true, ban: activeBan };
  }

  async checkWatchTimeLimit(userId: string): Promise<{ allowed: boolean; remainingSeconds: number }> {
    const today = new Date().toISOString().split('T')[0];
    const watchTime = await storage.getDailyWatchTime(userId, today);
    
    if (!watchTime) {
      return { allowed: true, remainingSeconds: DAILY_WATCH_LIMIT_SECONDS };
    }

    const remaining = DAILY_WATCH_LIMIT_SECONDS - watchTime.totalSeconds;
    return { 
      allowed: remaining > 0, 
      remainingSeconds: Math.max(0, remaining) 
    };
  }

  async updateWatchTime(userId: string, secondsWatched: number): Promise<void> {
    const today = new Date().toISOString().split('T')[0];
    await storage.updateDailyWatchTime(userId, today, secondsWatched);
  }

  async checkPlayAttemptLimit(userId: string): Promise<{ allowed: boolean; attemptsRemaining: number }> {
    const today = new Date().toISOString().split('T')[0];
    const watchTime = await storage.getDailyWatchTime(userId, today);
    
    if (!watchTime) {
      return { allowed: true, attemptsRemaining: MAX_PLAY_ATTEMPTS_PER_HOUR };
    }

    const remaining = MAX_PLAY_ATTEMPTS_PER_HOUR - watchTime.playAttempts;
    return { 
      allowed: remaining > 0, 
      attemptsRemaining: Math.max(0, remaining) 
    };
  }

  async incrementPlayAttempt(userId: string): Promise<void> {
    const today = new Date().toISOString().split('T')[0];
    await storage.incrementPlayAttempts(userId, today);
  }

  async generateVideoToken(
    userId: string,
    movieId: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<string> {
    const token = crypto.randomBytes(32).toString('hex');
    const now = Math.floor(Date.now() / 1000);
    const expiresAt = now + VIDEO_TOKEN_EXPIRY_SECONDS;

    await storage.createVideoAccessToken({
      userId,
      movieId,
      token,
      ipAddress,
      userAgent,
      expiresAt,
    });

    return token;
  }

  async validateVideoToken(
    token: string,
    userId: string,
    movieId: string,
    ipAddress?: string
  ): Promise<{ valid: boolean; reason?: string }> {
    const tokenRecord = await storage.getVideoAccessToken(token);
    
    if (!tokenRecord) {
      return { valid: false, reason: 'Token not found' };
    }

    if (tokenRecord.userId !== userId) {
      return { valid: false, reason: 'Token user mismatch' };
    }

    if (tokenRecord.movieId !== movieId) {
      return { valid: false, reason: 'Token movie mismatch' };
    }

    const now = Math.floor(Date.now() / 1000);
    if (now > tokenRecord.expiresAt) {
      return { valid: false, reason: 'Token expired' };
    }

    if (tokenRecord.ipAddress && ipAddress && tokenRecord.ipAddress !== ipAddress) {
      console.log(`[Security] IP mismatch for token: ${tokenRecord.ipAddress} vs ${ipAddress}`);
    }

    if (tokenRecord.used) {
      return { valid: false, reason: 'Token already used' };
    }

    await storage.markVideoTokenUsed(token);
    return { valid: true };
  }

  async getUserViolations(userId: string, limit: number = 50) {
    return storage.getUserViolations(userId, limit);
  }

  async getAllViolations(limit: number = 100) {
    return storage.getAllViolations(limit);
  }

  async getAllBans(limit: number = 100) {
    return storage.getAllBans(limit);
  }

  async unbanUser(userId: string) {
    await storage.deactivateAllUserBans(userId);
    console.log(`[Security] User ${userId} unbanned`);
  }
}

export const securityService = new SecurityService();
