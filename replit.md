# HR Studio 360

## Overview

HR Studio 360 is an AI-powered Human Resources management platform designed to streamline the entire employee lifecycle, from recruitment to offboarding. It offers comprehensive HR functionality, including hiring, employee management, payroll, performance reviews, benefits administration, time tracking, and analytics. The platform features a modular dashboard with over 40 specialized components, emphasizing user experience with celebration systems, real-time chat, and extensive customization. The project aims to provide an end-to-end HR solution, enhancing efficiency and employee engagement.

## Demo Account Access

The platform includes a pre-configured demo account for instant access to all features:

- **Demo Email**: `demo@hrstudio360.com`
- **Access Method**: Click the "Try Demo Account" button on the landing page or in the sign-in modal
- **Authentication**: Passwordless email-based authentication - no password required
- **Seeded Data**: When production database is seeded, the demo account includes sample employees, departments, job titles, and announcements

### Seeding Production Database

To populate the production database with comprehensive demo data, run:
```bash
npm run seed
```

This creates a complete, production-ready demo environment:

**Organizational Structure:**
- 7 user profiles (Demo User, Robert Sala, + 5 team members)
- 6 departments (Engineering, Product, Design, People, Marketing, Executive)
- 7 job titles with department assignments

**Employee Data:**
- 7 employee records with employment details
- 7 leave balance records (20 vacation, 10 sick, 5 personal days)
- 2 sample leave requests (1 pending, 1 approved)

**Recruitment Pipeline:**
- 3 active candidates at various stages (Interview, Phone Screen, Offer Sent)
- 1 new hire for onboarding (starts in 7 days)

**Performance Management:**
- 1 active review cycle (2025 Annual Performance Review)
- 2 performance reviews (1 completed with full feedback, 1 in-progress)
- 5 review questions with template
- 10 review responses (self and manager assessments)
- Goals and development plans

**Communications:**
- 2 company announcements

This comprehensive seed data demonstrates the full capabilities of HRStudio360 for client demos and showcases a realistic, active HR environment.

See `docs/PRODUCTION_SEEDING.md` for detailed seeding instructions.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

The frontend is a React 18 single-page application (SPA) built with TypeScript and Vite. It uses React Context for state management, Wouter for routing, and Tailwind CSS for styling with dark mode support. Internationalization is supported via i18next. Data fetching is handled by TanStack Query v5, configured for a backend API.

### Backend Architecture

The backend is an Express.js server providing a RESTful API across 29 database tables. It uses Drizzle ORM for type-safe database interactions and handles all authentication, including login, logout, and session management.

### Data Storage

The project utilizes a PostgreSQL database (Neon-backed) with its schema defined by Drizzle ORM. Key tables include `profiles`, `auth_credentials`, `employees`, `leave_requests`, `pay_stubs`, `celebration_badges`, `channels`, `performance_reviews`, and `announcements`. Drizzle Kit manages migrations. The backend provides a complete RESTful API for all data, with ongoing migration of frontend components to this API.

### Authentication & Authorization

Authentication is managed by the backend Express API using server-side sessions (`express-session`) with secure password-based authentication:

**Password Security (Security Audit Compliant):**
- **Argon2id hashing**: OWASP-compliant settings (64MB memory, timeCost 3, parallelism 1)
- **Password requirements**: Minimum 12 characters with at least 3 of 4 character classes (uppercase, lowercase, numbers, special characters)
- **Common password denylist**: Prevents weak passwords
- **Progressive account lockout**: 5 failed attempts → 15min lock, 10 attempts → 30min, 15+ → 1 hour
- **Rate limiting**: 5 authentication requests per 15 minutes per IP address
- **Database table**: `auth_credentials` stores hashed passwords, failed attempt counters, and lockout timestamps

**Session Management:**
- `AuthContext` in the frontend handles authentication state, session validation, and refresh
- Session regeneration on login prevents fixation attacks
- httpOnly cookies for session security

**Special Access:**
- **Demo account**: Passwordless authentication for `demo@hrstudio360.com` for ease of access
- **Impersonation feature**: Available for administrators

### Real-time Features

⚠️ **Migration Status**: Real-time features are currently being migrated from Supabase to backend infrastructure.

The system includes an enterprise chat system with channels and direct messages, a celebration system for milestones, and a general real-time notification system. These features previously leveraged Supabase Realtime and are being migrated to WebSocket-based backend APIs.

**See `docs/SUPABASE_REMOVAL_IMPACT.md` for detailed migration status and affected features.**

### Collaboration Features

A collaborator invitation system allows users to invite team members. This includes database tracking, backend API endpoints for invitations, email notifications via Resend, in-app notifications, and an AI-powered employee search utility. The system features an enhanced multi-select employee picker with filtering and batch invitation capabilities.

### AI Integration

AI capabilities, powered by OpenAI API, include an AI Assistant for HR policy and employee information, candidate screening, predictive analytics, automated insights, and AI-powered employee search.

### Design Patterns

The system heavily uses a modal-based interface. A service layer encapsulates business logic, and optimistic UI updates are employed for perceived performance. Error boundaries are used for graceful error handling.

### Testing Infrastructure

A comprehensive testing suite uses Jest and Testing Library for both frontend unit tests (covering utilities like `logger` and `apiErrors`) and backend integration tests (for analytics endpoints). Jest is configured to support both client and server environments.

### Error Handling & Resilience

A robust error handling system includes a reusable `ErrorBoundary` component, a centralized `logger` utility (integrated with Sentry), and `apiErrors` utilities for parsing, user-friendly messages, and retry logic. TanStack Query is configured with smart retry logic and exponential backoff.

### Production Monitoring

Sentry is integrated for comprehensive error tracking and performance monitoring across both frontend and backend. It includes browser error tracking, performance monitoring, session replay, and user context tracking, with privacy-first defaults.

## External Dependencies

### Third-Party Services

-   **Resend**: For transactional email delivery.
-   **OpenAI**: Powers AI functionalities.
-   **Neon**: Provides PostgreSQL database hosting.
-   **Sentry**: For error tracking and performance monitoring.

**Note**: Supabase has been removed as part of the backend migration. Real-time features and file storage are being migrated to self-hosted backend infrastructure.

### NPM Dependencies

-   **Core Framework**: `react`, `react-dom`, `typescript`, `vite`, `express`.
-   **Database & ORM**: `drizzle-orm`, `drizzle-kit`, `drizzle-zod`, `@neondatabase/serverless`.
-   **Authentication & Security**: `argon2`, `express-rate-limit`, `express-session`.
-   **UI Libraries**: `lucide-react`, `tailwindcss`, `emoji-picker-react`, `react-animated-weather`.
-   **Forms & Validation**: `react-hook-form`, `@hookform/resolvers`, `zod`.
-   **Utilities**: `jspdf`, `html2canvas`, `i18next`, `react-i18next`, `wouter`, `ws`.

### Environment Variables

-   **Required**: `DATABASE_URL`.
-   **Optional**: `RESEND_API_KEY`, `OPENAI_API_KEY`, `SENTRY_DSN`, `VITE_SENTRY_DSN`.

**Note**: `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are no longer required after Supabase removal.