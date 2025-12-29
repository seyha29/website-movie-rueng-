# RUENG - Replit Project Guide

## Overview

RUENG (formerly Reoung Movies Flix) is an iFlix KH-inspired, single-page streaming platform for browsing movies. It features a **pay-per-video model ($1 per movie)** where users purchase individual videos instead of monthly subscriptions. The platform includes:

### 🎯 Core Features
- **Free Trailers**: All movie trailers are free to watch - no login or payment required. Trailers are embedded directly on the movie detail page with a "FREE TO WATCH" badge
- **Pay-Per-Video**: Full movies require a one-time $1 purchase (unless marked as free with isFree=1)
- **Forever Playback**: Once a user purchases a video for $1, they can watch it unlimited times forever - no re-payment required
- **Auto-Add to My List**: After successful payment, purchased videos automatically appear in the user's "My List" profile section
- **Smart Play Button**: Button text adapts based on video type - "Play Full Movie" for free content, "Watch Full Movie ($1)" for paid content
- **RaksmeyPay Integration**: Secure payment processing with QR code support for mobile payments
- **Single-Device Login**: One account can only be logged in on one device at a time. Logging in on a new device automatically logs out the previous device to prevent account sharing

### 🎨 Design & UX
Minimalist grid-based design with multiple filter options and centered search functionality. Orange color scheme (#f97316) with Inter font family throughout. The homepage starts directly with the movie grid for maximum content visibility. The application is built to scale for over 50,000 movies with responsive grid layouts and a full-stack React frontend and Express/PostgreSQL backend.

**Filter Options:**
- **Genre**: 15 categories (Action, Adventure, Comedy, Crime, Drama, Fantasy, Horror, Mystery, Romance, Sci-Fi, Supernatural, Thriller, War, Anime)
- **Rating**: 6 ranges (All, 9+, 8-9, 7-8, 6-7, Below 6)
- **Year**: 6 ranges (All, 2024+, 2020-2023, 2010-2019, 2000-2009, Before 2000)
- **Country**: 12 countries (Cambodia, Thailand, Malaysia, Vietnam, Indonesia, USA, Korea, India, Philippines, China, Japan, Other)

**Pagination:**
- Pagination controls appear both at the top and bottom of the movie grid
- Shows up to 30 movies per page
- Always visible when there are multiple pages (total > 30 movies)
- Rating, Year, and Country filters work on the current page's results (client-side filtering)

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework & Build System**: React 18 with TypeScript, Vite for fast development, and Wouter for lightweight routing. Code is in the `client/` directory.
- **UI Component System**: Shadcn UI (New York style) built on Radix UI primitives, styled with Tailwind CSS using custom design tokens. Uses a dark theme with an orange primary accent (#f97316), and Inter font family throughout.
- **State Management**: TanStack Query for server state and caching, React Hook Form with Zod for validation.
- **Design System**: iFlix KH-inspired, minimalist design with grid-based layouts, genre-based filtering (15 genres including Action, Adventure, Comedy, Crime, Drama, Fantasy, Horror, Mystery, Romance, Sci-Fi, Supernatural, Thriller, War, Anime), hover interactions, and clean visual hierarchy. Movies display in responsive grids (3-6 columns) with simple hover overlays showing Play and Add to List actions. **Streamlined UX**: One-click movie playback - clicking any movie card immediately starts the video player flow, completely skipping the detail modal for faster access to content. Homepage starts directly with the movie grid (no hero banner) for maximum content density.
- **Navigation**: Header with logo left, centered search bar (desktop), and user menu right. Mobile uses simplified header with hamburger menu drawer.

### Backend Architecture
- **Server Framework**: Express.js on Node.js with TypeScript, using ESM modules. `tsx` for dev, esbuild for prod.
- **API Design**: RESTful API under `/api` for authentication, movie browsing (with pagination up to 30 videos per page, search, genre filtering with 15 genres), user-specific "My List" management, and admin functionalities. Specific endpoints for `movies`, `my-list`, `auth`, `admin`, and `payments`.
- **Payment Integration**: Integrates with RaksmeyPay for a $2/month pay-per-view subscription model.
  - **Provider Selection**: Automatically detects `RAKSMEYPAY_PROFILE_ID` (merchant_id) and `RAKSMEYPAY_PROFILE_KEY` (profile_key) environment variables. With credentials → uses `RealRaksmeyPayProvider` (production). Without credentials → uses `MockRaksmeyPayProvider` (development). Cannot be manipulated at runtime.
  - **Payment Flow (3 Steps)**:
    1. **Generate Payment URL**: Backend builds GET request URL: `https://raksmeypay.com/payment/request/{merchant_id}?transaction_id={timestamp}&amount=2&success_url={encoded_callback}&remark={description}&hash={sha1}`. Hash formula: `SHA1(profile_key + transaction_id + amount + success_url + remark)`. Frontend displays this URL in iframe modal with QR code.
    2. **Handle Success Callback**: After payment, RaksmeyPay redirects to success_url with parameters: `success_time`, `success_amount`, `bakong_hash`, `success_hash`, `transaction_id`. Backend validates hash: `SHA1(profile_key + success_time + success_amount + bakong_hash + transaction_id)`. Validates 180-second token expiration.
    3. **Verify Payment Status**: Backend calls verification API: `POST https://raksmeypay.com/api/payment/verify/{merchant_id}` with `transaction_id` and `hash = SHA1(profile_key + transaction_id)`. Validates `payment_status == "SUCCESS"` and amount matches before activating subscription.
  - **Security**: SHA1 signature validation at both callback and verification stages, 180-second token expiration, amount verification, transaction ownership checks, idempotent processing. Mock endpoint has triple-layer protection (NODE_ENV + dev secret + ownership).
- **Data Storage**: PostgreSQL (Neon serverless) via Drizzle ORM is the primary storage, with an in-memory fallback for development. Schema defined in `shared/schema.ts` includes `movies`, `users`, and `my_list` tables, with flags like `isHeroBanner`, `isTrending`, `isNewAndPopular`, and `videoEmbedUrl`. Database seeding only occurs on first installation to protect existing data.
- **Development Features**: Request/response logging, Vite integration, hot module replacement, and Replit-specific error overlay.

### Data Models
- **Movie Schema**: `id`, `title`, `description`, `rating`, `year`, `duration`, `genres`, `cast`, `director`, `country`, `posterImage`, `backdropImage`, `videoEmbedUrl` (full movie), `trailerUrl` (preview), `isFree` (1=free, 0=paid), `isTrending`, `isNewAndPopular`.
- **User Schema**: `id`, `fullName`, `phoneNumber` (unique, optional), `email` (unique, optional), `password` (hashed), `currentSessionId` (for single-device login). Note: Users are regular customers only. Users can register/login with either phone number OR email.
- **Pending Phone Registration Schema**: `id`, `phoneNumber`, `fullName`, `passwordHash`, `otpHash`, `otpExpiresAt`, `attemptCount`, `resendCount`, `createdAt` - For SMS OTP verification during phone registration.
- **Pending Email Registration Schema**: `id`, `email`, `fullName`, `passwordHash`, `otpHash`, `otpExpiresAt`, `attemptCount`, `resendCount`, `createdAt` - For email OTP verification during registration.
- **Admin Schema**: `id`, `username` (unique), `password` (hashed), `fullName`, `role` (full/video), `currentSessionId`, `createdAt`. Admins are stored in a separate table from users.
- **My List Schema**: `id`, `userId`, `movieId`, `addedAt`.
- **Movie Views Schema**: `id`, `userId`, `movieId`, `viewedAt`, `watchDuration` - Tracks individual movie views and watch time for analytics.
- **Subscriptions Schema**: `subscriptionPlans`, `userSubscriptions`, `paymentTransactions` - Full payment tracking system.

### Admin System (Separate from Users)
- **Admin Authentication**: Separate login at `/admin/login` using username/password (not phone number like users)
- **Admin Roles**: 
  - `full`: Complete access to all admin features (analytics, users, videos, banners, admins management)
  - `video`: Video management access only
- **Admin API Endpoints**: 
  - `/api/admin/auth/login`, `/api/admin/auth/logout`, `/api/admin/auth/me` for admin authentication
  - `/api/admin/admins` (GET/POST) for admin management (full admin only)
  - `/api/admin/admins/:id` (DELETE) for deleting admins
- **Single-Device Login**: Admins also have single-device login enforcement
- **Default Admin**: On first startup, creates admin account (username: admin, password: Samnang@@##5678)
- **Security**: Password hashing with bcrypt, session-based auth with single-device enforcement, no password/session data exposed in API responses

### Admin Analytics Dashboard
- **Access**: Available at `/admin/analytics` for full admin role
- **Features**:
  - **Overview Tab**: Total users, active subscribers, new vs lost subscribers, total revenue, revenue this month, total watch time, average watch time per view, total movie views, subscriber trends chart, recent activity feed
  - **Revenue Tab**: Monthly revenue trends (line chart), revenue breakdown table by month, average revenue per subscriber, all-time total revenue
  - **Content Tab**: Top 10 movies by views and watch time, top genres pie chart, genre performance table with popularity bars
  - **Issues Tab**: Failed payment transactions, system performance metrics, error summary dashboard
  - **Predictions Tab**: AI-powered predictions (next month revenue forecast, projected subscribers, churn rate, growth rate), strategic recommendations based on data trends
- **Analytics API Endpoints**: `/api/admin/analytics/overview`, `/api/admin/analytics/top-movies`, `/api/admin/analytics/top-genres`, `/api/admin/analytics/revenue`, `/api/admin/analytics/payment-issues`, `/api/admin/analytics/recent-activity`
- **Visualization**: Uses Recharts library for bar charts, line charts, and pie charts

### Routing Structure
- **Frontend Routes**: `/`, `/register`, `/login`, `/profile`, `/movies`, `/tv-shows`, `/new`, `/my-list`, `/search/:query`, `/admin`, `/admin/login`, `/admin/analytics`, `/admin/videos`, `/admin/users`, `/admin/banners`, `/admin/admins`.
- **Component Organization**: Pages in `client/src/pages/`, reusable components in `client/src/components/`, Shadcn UI in `client/src/components/ui/`.

### Performance Optimizations
- **React Query Caching**: Configured with `staleTime: 5 * 60 * 1000` for efficient data fetching and instant content display.
- **Image Loading Strategy**: `loading="lazy"` for most images, `loading="eager"` for hero section, using `decoding="async"`.
- **Loading States & UX**: Skeleton screens with `animate-pulse` for immediate visual feedback.
- **Static Asset Delivery**: Express serves optimized images from `/generated_images/` and `/stock_images/`.

## External Dependencies

- **Core Frameworks**: `@vitejs/plugin-react`, `express`, `react`, `react-dom`, `wouter`.
- **UI & Styling**: `tailwindcss`, `@radix-ui/*`, `class-variance-authority`, `clsx`, `tailwind-merge`, `lucide-react`, `embla-carousel-react`, `recharts`.
- **State Management & Validation**: `@tanstack/react-query`, `react-hook-form`, `@hookform/resolvers`, `zod`.
- **Database & ORM**: `drizzle-orm`, `drizzle-zod`, `@neondatabase/serverless`, `drizzle-kit`.
- **Development Tools**: `typescript`, `tsx`, `esbuild`, `vite`, `@replit/*`.
- **Utilities**: `date-fns`, `cmdk`, `nanoid`, `connect-pg-simple`.
- **Asset Management**: Custom images in `attached_assets/generated_images/` and stock images in `attached_assets/stock_images/`, served via Express.

## SMS & Email OTP Verification

### SMS OTP (Phone Registration)
- **Provider**: MoceanAPI (MOCEAN_API_TOKEN environment variable)
- **Sender ID**: "RUENG"
- **OTP Format**: 6-digit numeric code
- **Expiration**: 5 minutes
- **Max Attempts**: 3 attempts per OTP code
- **Max Resends**: 3 resends per registration session
- **Cooldown**: 60 seconds between OTP requests, 5 minutes after max resends
- **API Endpoints**: `/api/auth/verify-phone-otp`, `/api/auth/resend-phone-otp`

### Email OTP (Email Registration)
- **Provider**: Nodemailer (EMAIL_USER, EMAIL_PASS environment variables)
- **OTP Format**: 6-digit numeric code
- **Expiration**: 10 minutes
- **Max Attempts**: 5 attempts per OTP code
- **Max Resends**: 3 resends per registration session
- **API Endpoints**: `/api/auth/verify-email-otp`, `/api/auth/resend-email-otp`