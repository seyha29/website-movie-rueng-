# Screen Protection & Anti-Piracy Features

## Overview

Reoung Movies Flix implements multiple layers of screen protection to deter unauthorized copying and distribution of premium content. This document explains what protection is in place, how it works, and its limitations.

## ⚠️ Important Limitation

**Web browsers CANNOT completely prevent screenshots or screen recordings.** This is a fundamental technical limitation because:
- Screenshots are operating system functions, not browser functions
- Users can always use external cameras or capture devices
- No JavaScript API exists to truly block OS-level capture

Our implementation focuses on **deterrence** rather than prevention.

## Protection Features Implemented

### 1. Screenshot Detection & Warnings

**What it does:**
- Detects keyboard shortcuts commonly used for screenshots
- Shows warning toasts when detection triggers
- Logs all attempts with user identification
- Clears clipboard after Print Screen key press

**Detected shortcuts:**
- Windows: `Print Screen`, `Win + Shift + S` (Snipping Tool)
- macOS: `Cmd + Shift + 3`, `Cmd + Shift + 4`, `Cmd + Shift + 5`

**Implementation:** `client/src/components/ScreenProtection.tsx`

**Effectiveness:** ⭐⭐☆☆☆ (Limited - easily bypassed with third-party tools)

### 2. Dynamic Watermarking

**What it does:**
- Displays user information (name, phone number) across video content
- Updates timestamp every 10 seconds
- Randomizes position every 30 seconds to prevent cropping
- Multiple watermark layers (center, corners, diagonal pattern)
- Intensity levels: light, medium, strong

**Watermark contents:**
- Main overlay: User name + Phone number + Timestamp (rotated 45°)
- Corner overlays: Phone number and timestamp
- Diagonal pattern: Phone number repeated

**Implementation:** `client/src/components/DynamicWatermark.tsx`

**Effectiveness:** ⭐⭐⭐⭐☆ (High - makes unauthorized sharing traceable)

### 3. Right-Click Protection

**What it does:**
- Disables context menu (right-click)
- Prevents "Save image as" and "Copy image" options
- Shows warning toast when attempted

**Effectiveness:** ⭐⭐☆☆☆ (Low - users can still use keyboard shortcuts or DevTools)

### 4. DevTools Detection

**What it does:**
- Periodically checks for browser DevTools opening
- Logs when DevTools are detected
- Can trigger security events

**Effectiveness:** ⭐☆☆☆☆ (Very Low - easy to bypass)

### 5. Security Event Logging

**What it does:**
- Logs all protection events to server
- Tracks: Event type, user ID, timestamp, user agent, details
- Stored in server logs (can be extended to database)

**Logged events:**
- `screenshot_attempt` - Keyboard shortcut detected
- `page_hidden` - User switched away (possible recording app)
- `developer_tools` - DevTools opened

**API Endpoint:** `POST /api/security/log`

**Effectiveness:** ⭐⭐⭐⭐⭐ (High - provides audit trail and identifies bad actors)

### 6. Text Selection Disabled

**What it does:**
- CSS prevents text selection on video player
- Makes copying text overlays harder

**Effectiveness:** ⭐⭐☆☆☆ (Low - cosmetic only)

## How to Use

### For Users
The protection works automatically. When watching videos:
1. Watermarks appear with your user information
2. Right-click is disabled
3. Screenshot attempts trigger warnings
4. Your activity is logged for security

### For Administrators
View security logs in server console:
```
[SECURITY] Event: screenshot_attempt | User: 123 | Details: Print Screen | ...
```

To extend logging to database, modify `server/routes.ts`:
```typescript
// Uncomment in security logging endpoint:
await storage.logSecurityEvent({ userId, eventType, details, userAgent, timestamp });
```

## Technical Details

### Components Architecture

```
App.tsx
└── ScreenProtection (wraps entire app)
    ├── Keyboard event listeners
    ├── DevTools detection
    ├── Right-click prevention
    └── Router + Pages
        └── VideoPlayer
            └── DynamicWatermark
                ├── Main centered overlay
                ├── Corner overlays
                └── Diagonal pattern
```

### Watermark Configuration

Edit intensity in `VideoPlayer.tsx`:
```typescript
<DynamicWatermark 
  intensity="light"   // Options: light, medium, strong
  showTimestamp={true} // Show/hide timestamp
/>
```

### Toggle Warnings

Disable warning toasts in `App.tsx`:
```typescript
<ScreenProtection showWarnings={false}>
```

## What Can Still Be Bypassed

Despite our protections, determined users can still:

1. **Use External Cameras** - Point phone/camera at screen
2. **Use HDMI Capture Cards** - Hardware capture devices
3. **Third-Party Screen Recorders** - OBS, ShareX, etc.
4. **Disable JavaScript** - Removes all protections
5. **Mobile Screenshot Tools** - OS-level functions we can't detect
6. **Edit Watermarks** - Video editing software can blur/crop watermarks

## Best Practices

### Recommended Approach
1. **Accept** that complete prevention is impossible
2. **Use watermarking** to make sharing traceable and discourage it
3. **Monitor security logs** to identify repeated offenders
4. **Enforce Terms of Service** - Legal agreements with users
5. **Fast takedown procedures** - Quickly remove pirated content

### For Maximum Protection (Future Enhancements)
If stronger protection is needed, consider:

1. **DRM Video Encryption** (Widevine/FairPlay)
   - Protects video streams at hardware level
   - Requires DRM provider (VdoCipher, Gumlet, etc.)
   - Works on: Safari (macOS), Edge (Windows), native mobile apps
   - Cost: $50-500/month depending on views

2. **Native Mobile Apps**
   - Android: Use `FLAG_SECURE` to prevent screenshots
   - iOS: Detect screenshots with notifications
   - 90%+ effectiveness on mobile

3. **Forensic Watermarking**
   - Embed invisible watermarks in video stream
   - Identify source of leaks
   - Requires video processing infrastructure

## Cost-Benefit Analysis

| Feature | Implementation Cost | Effectiveness | User Experience Impact |
|---------|-------------------|---------------|----------------------|
| Dynamic Watermarking | ✅ Free (included) | ⭐⭐⭐⭐☆ | Low |
| Screenshot Detection | ✅ Free (included) | ⭐⭐☆☆☆ | Low |
| Security Logging | ✅ Free (included) | ⭐⭐⭐⭐⭐ | None |
| DRM Encryption | 💰 $50-500/month | ⭐⭐⭐⭐☆ | Medium |
| Native Apps | 💰💰 Development cost | ⭐⭐⭐⭐⭐ | High |

## Conclusion

Our implementation provides **reasonable deterrence** against casual copying while maintaining a good user experience. The dynamic watermarking makes any leaked content traceable back to the source user, which is our strongest protection layer.

For a streaming platform with $2/month subscriptions, this level of protection is appropriate. Investing in expensive DRM solutions only makes sense if piracy becomes a measurable revenue problem.

## Support

For questions or issues, contact the development team or check:
- Implementation: `client/src/components/ScreenProtection.tsx`
- Watermarks: `client/src/components/DynamicWatermark.tsx`
- Video Player: `client/src/components/VideoPlayer.tsx`
- Backend Logging: `server/routes.ts` (search for `/api/security/log`)
