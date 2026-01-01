# RUENG - Replit Project Guide

## Overview
RUENG is a single-page streaming platform inspired by iFlix KH, offering a unique pay-per-video model ($1 per movie). Users purchase individual movies, which are then available for unlimited, forever playback. The platform includes a credit wallet system, with new users receiving a $5 welcome bonus. All movie trailers are free to watch. The design is minimalist, grid-based, with an orange color scheme and supports extensive filtering, search, and pagination for a large movie catalog. The business vision is to provide an accessible, pay-per-content streaming service with a focus on user ownership of purchased content, targeting a market segment that prefers one-time purchases over recurring subscriptions.

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture

### UI/UX Decisions
- **Design**: iFlix KH-inspired, minimalist, grid-based layout with an orange color scheme (#f97316) and Inter font family.
- **Responsiveness**: Responsive grid layouts (3-6 columns) for movies.
- **Navigation**: Header with left-aligned logo, centered search, and right-aligned user menu. Mobile uses a simplified header with a hamburger menu.
- **Interaction**: One-click movie playback from any movie card; homepage starts directly with the movie grid for maximum content density.
- **Filtering**: Extensive genre (15 categories), rating (6 ranges), year (6 ranges), and country (12 countries) filters with pagination.

### Technical Implementations
- **Frontend**: React 18 with TypeScript, Vite, and Wouter. Shadcn UI (New York style) on Radix UI primitives, styled with Tailwind CSS. State managed with TanStack Query and React Hook Form with Zod. Code resides in the `client/` directory.
- **Backend**: Express.js on Node.js with TypeScript (ESM modules). RESTful API under `/api` for auth, movies, user lists, and admin functions.
- **Payment**: RaksmeyPay integration for secure transactions ($1 per movie). Uses a secure three-step payment flow with SHA1 signature validation and 180-second token expiration. Environment variables `RAKSMEYPAY_PROFILE_ID` and `RAKSMEYPAY_PROFILE_KEY` determine production vs. mock provider.
- **Database**: PostgreSQL (Neon serverless) with Drizzle ORM. In-memory fallback for development. Schema includes `movies`, `users`, `my_list`, `credit_transactions`, `app_settings`, `pending_phone_registration`, `pending_email_registration`, `admins`, `movie_user_ratings`, `movie_views`, and `subscriptions`.
- **Authentication**: Single-device login enforced for both users and admins. User registration via phone number (SMS OTP using MoceanAPI) or email (Email OTP using Nodemailer).
- **Admin System**: Separate login (`/admin/login`) with role-based access (`full` or `video`). Default admin account created on first startup (username: admin, password: Samnang@@##5678). Includes a comprehensive analytics dashboard with real-time viewer tracking via a heartbeat system.

### Feature Specifications
- **Free Trailers**: All trailers are free to watch without login or payment.
- **Pay-Per-Video**: Full movies require a $1 purchase (unless `isFree=1`).
- **Credit Wallet**: Users have a credit balance; new users get a $5 bonus.
- **Forever Playback**: Once purchased, movies can be watched unlimited times.
- **"My List"**: Purchased videos automatically added to user's "My List."
- **Smart Play Button**: Dynamically displays "Play Full Movie" (free) or "Watch Full Movie ($1)" (paid).
- **Analytics Dashboard**: Comprehensive admin dashboard with overview, live viewer tracking, revenue, content performance, and prediction tabs.
- **Performance**: React Query caching, lazy image loading, skeleton screens, and optimized static asset delivery.

## External Dependencies

- **Core Frameworks**: `@vitejs/plugin-react`, `express`, `react`, `react-dom`, `wouter`.
- **UI & Styling**: `tailwindcss`, `@radix-ui/*`, `class-variance-authority`, `clsx`, `tailwind-merge`, `lucide-react`, `embla-carousel-react`, `recharts`.
- **State Management & Validation**: `@tanstack/react-query`, `react-hook-form`, `@hookform/resolvers`, `zod`.
- **Database & ORM**: `drizzle-orm`, `drizzle-zod`, `@neondatabase/serverless`, `drizzle-kit`.
- **Development Tools**: `typescript`, `tsx`, `esbuild`, `vite`, `@replit/*`.
- **Utilities**: `date-fns`, `cmdk`, `nanoid`, `connect-pg-simple`.
- **Payment Gateway**: RaksmeyPay (integration via environment variables `RAKSMEYPAY_PROFILE_ID`, `RAKSMEYPAY_PROFILE_KEY`).
- **SMS OTP Provider**: MoceanAPI (via `MOCEAN_API_TOKEN` environment variable).
- **Email OTP Provider**: Nodemailer (via `EMAIL_USER`, `EMAIL_PASS` environment variables).
- **Asset Management**: Custom images in `attached_assets/generated_images/` and stock images in `attached_assets/stock_images/`.