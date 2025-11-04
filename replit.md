# HR Studio 360

## Overview

HR Studio 360 is a comprehensive, AI-powered Human Resources management platform designed to streamline the entire employee lifecycle from recruitment through offboarding. The application provides end-to-end HR functionality including hiring workflows, employee management, payroll processing, performance reviews, benefits administration, time tracking, and analytics.

Built as a modern single-page application (SPA), the system features a modular dashboard architecture with 40+ specialized modal components covering all aspects of HR operations. The platform emphasizes user experience with celebration systems for birthdays/anniversaries, real-time chat capabilities, and extensive customization options.

## User Preferences

Preferred communication style: Simple, everyday language.

## Migration Progress (November 2025)

### Completed Foundation Work

**Database Schema Expansion** ✅
- Expanded from 5 tables to 29 comprehensive tables covering full HR domain
- Added candidate management tables (candidates, candidateCollaborators, candidateComments, candidateRatings, newHires)
- Added expense management tables (currencies, expenseCategories, expenseVendors, expenses, employeeExpenseEnrollment)
- Added celebration system tables (celebrationBadges, earnedBadges, celebrationHistory, celebrationNotifications)
- Added chat infrastructure tables (channels, channelMembers, messages)
- All tables use proper TypeScript types with Drizzle ORM schema inference

**Storage Layer** ✅
- `IStorage` interface expanded with methods for all 29 tables
- All storage methods properly typed using shared schema types (Profile, Employee, LeaveRequest, etc.)
- Celebration methods use InsertCelebrationBadge, EarnedBadge, CelebrationHistory types
- Fixed critical bug: using and() predicate for combining multiple WHERE conditions instead of chaining .where() calls
- Database storage implementation (DbStorage) complete with type-safe queries

**API Layer** ✅
- RESTful endpoints for all resources in server/routes.ts
- Authentication endpoints: POST /api/auth/login, POST /api/auth/logout, GET /api/auth/session
- Profile endpoints: GET /api/profiles, GET /api/profiles/:id, PATCH /api/profiles/:id
- Employee endpoints: GET /api/employees, POST /api/employees, PATCH /api/employees/:id
- Leave request endpoints with full CRUD operations
- Candidate endpoints for hiring workflow management
- Expense endpoints for financial tracking
- Channel and message endpoints for chat system

**API Client** ✅
- Fully typed API client in src/lib/api.ts
- TypeScript interfaces for User, Session, Profile with proper type safety
- Authentication methods: login(), logout(), getSession(), getProfile()
- All methods return properly typed promises for type-safe consumption

**Authentication Migration** ✅
- AuthContext completely migrated from Supabase to backend API
- All sign in/sign up/sign out operations now use Express backend
- Session management using backend /api/auth/session endpoint
- Profile loading via backend /api/profiles endpoint
- Removed Supabase auth dependencies from authentication flow
- User impersonation feature preserved and working

**Server Infrastructure** ✅
- Express server running on port 5000
- Integrated with Vite development middleware for seamless SPA serving
- All tests passing, server boots cleanly

### Remaining Work

**Frontend Component Migration** (60+ modals)
- Migrate celebrationService to use new API client instead of Supabase
- Update all modal components to use API client instead of direct Supabase queries
- Migrate utility services (chatService, changeLogService, etc.)
- Update real-time subscriptions from Supabase Realtime to WebSocket/polling strategy
- Migrate file storage from Supabase Storage to new solution

**Testing & Validation**
- End-to-end testing of all migrated features
- Validate celebration flows (earning, viewing, dismissing badges)
- Ensure all frontend payload shapes match Insert* schemas

**Status**: Foundation complete and architect-validated. Ready for systematic component migration.

## System Architecture

### Frontend Architecture

**Framework**: React 18 with TypeScript, using Vite as the build tool and development server.

**State Management**: Context-based architecture with dedicated contexts for authentication (`AuthContext`) and theming (`ThemeProvider`). Component state managed through React hooks with no external state management library.

**Routing**: Wouter-based client-side routing handling three main views: landing page, dashboard, and user profile. Navigation controlled through `App.tsx` with authentication guards via `ProtectedRoute`.

**UI Component Structure**: Highly modular design with 60+ modal components for different HR functions. Core dashboard (`Dashboard.tsx`) acts as the primary container, managing modal visibility and cross-modal communication through ref-based APIs.

**Styling**: Tailwind CSS for utility-first styling with dark mode support via CSS classes. Custom animations for celebrations (confetti, fireworks) implemented through CSS and React state.

**Internationalization**: i18next integration with browser language detection, supporting English and Spanish with translations stored in JSON files.

### Backend Architecture

**Server**: Express.js server running on port 5000, integrated with Vite development middleware for seamless SPA serving.

**API Layer**: RESTful API routes defined in `server/routes.ts` providing comprehensive endpoints for all 29 database tables including profiles, employees, leave requests, candidates, expenses, channels, messages, celebration system, and authentication.

**Storage Interface**: Abstracted through `IStorage` interface in `server/storage.ts`, implemented with database-backed storage (`DbStorage` class) using Drizzle ORM for type-safe database queries. All methods properly typed with shared schema types.

**Migration Status**: Backend infrastructure 100% complete with all 29 tables, typed storage methods, and API endpoints. AuthContext fully migrated to backend API. Frontend components (60+ modals) still using Supabase for database queries and need systematic migration to API client. Real-time features and file storage migration pending.

### Data Storage

**Database**: PostgreSQL (Neon-backed) with schema defined in `shared/schema.ts` using Drizzle ORM.

**Core Tables**:
- `profiles`: User accounts with contact info, preferences, and roles
- `employees`: Complete employee records with employment details
- `departments` & `job_titles`: Organizational structure
- `leave_requests` & `leave_balances`: Time-off management
- `pay_stubs` & `paycheck_fun_facts`: Payroll data with engagement features
- `celebration_badges` & `earned_badges`: Anniversary recognition system
- Chat system tables: `channels`, `channel_members`, `messages`, `message_reactions`
- Performance review tables: `performance_reviews`, `review_goals`

**Schema Management**: Drizzle Kit for migrations with `npm run db:push` for schema synchronization.

**Current Database Access**: Backend provides complete RESTful API for all 29 tables with full CRUD operations. AuthContext migrated to backend API. Frontend modal components (60+) still using Supabase client - systematic migration to API endpoints in progress.

### Authentication & Authorization

**Current System**: Fully migrated from Supabase Auth to backend Express API. All authentication operations (login, logout, session management) now use backend endpoints.

**Session Handling**: `AuthContext` manages authentication state using backend `/api/auth/session` endpoint with automatic session refresh, retry logic for network failures, and session expiry warnings.

**Impersonation**: Built-in user impersonation capability for administrators/HR staff to view the application as other users. Managed through separate `impersonatedUser` and `actualUser` state with visual banner indicator. Fully preserved during migration.

**Backend Endpoints**: 
- POST `/api/auth/login`: User authentication
- POST `/api/auth/logout`: Session termination
- GET `/api/auth/session`: Session validation and refresh

### Real-time Features

**Chat System**: Enterprise chat with channels, direct messages, message threading, reactions, and read receipts. Currently using Supabase Realtime for live updates.

**Celebrations**: Automatic birthday and work anniversary detection with full-screen modal celebrations, 40-badge progression system, and notification replays within 7 days.

**Notifications**: Real-time notification system for chat messages, celebration events, and system announcements.

### AI Integration

**AI Assistant**: Chat-based AI assistant using OpenAI API (via backend endpoint `/api/ai-assistant/chat`). Provides HR policy guidance, employee information lookup, and general HR support.

**AI Features**: Candidate screening scores, predictive analytics for performance reviews, and automated insights in various modules.

### File Processing

**Receipt OCR**: Document processing for expense management (edge function not yet migrated to backend).

**PDF Generation**: Client-side PDF generation using jspdf and html2canvas for pay stubs, performance reviews, and reports.

**Profile Pictures**: Avatar generation and storage with default generated icons for users without uploaded photos.

### Design Patterns

**Modal-Based Interface**: Primary interaction pattern with centralized modal state management in `Dashboard.tsx`. Modals communicate via ref callbacks and prop drilling.

**Service Layer Pattern**: Utility services (`celebrationService`, `chatService`, `changeLogService`) encapsulate business logic and database interactions.

**Optimistic UI Updates**: Many operations update UI immediately before database confirmation for better perceived performance.

**Error Boundaries**: Top-level error boundary wraps entire application to catch and display React errors gracefully.

## External Dependencies

### Third-Party Services

**Supabase** (currently primary backend):
- **Authentication**: User sign-in/sign-up, session management, password reset
- **Database**: PostgreSQL hosting with real-time subscriptions
- **Storage**: File uploads for profile pictures, documents
- **Edge Functions**: Currently hosts onboarding email and AI chat functions
- **Status**: Planned for replacement with self-hosted backend, migration in progress

**Resend** (email delivery):
- **Purpose**: Transactional email sending for onboarding notifications
- **Integration**: Via Supabase Edge Function `send-onboarding-email`
- **Configuration**: API key stored in Supabase environment
- **Fallback**: Logs email content to console if API key not configured

**OpenAI** (AI capabilities):
- **Purpose**: Powers AI Assistant chat functionality
- **Integration**: Backend endpoint `/api/ai-assistant/chat` interfaces with OpenAI API
- **Model**: GPT-based conversational AI for HR support

**Neon** (database hosting):
- **Purpose**: PostgreSQL database backend
- **Integration**: Via connection string in `DATABASE_URL` environment variable
- **WebSocket**: Uses `@neondatabase/serverless` with WebSocket support for serverless compatibility

### NPM Dependencies

**Core Framework**:
- `react` & `react-dom`: UI framework (v18.3.1)
- `typescript`: Type safety
- `vite`: Build tool and dev server
- `express`: Backend HTTP server

**Database & ORM**:
- `drizzle-orm` & `drizzle-kit`: Type-safe database queries and migrations
- `drizzle-zod`: Zod schema integration for validation
- `@neondatabase/serverless`: PostgreSQL client

**Supabase**:
- `@supabase/supabase-js`: Client library for current backend

**UI Libraries**:
- `lucide-react`: Icon system
- `tailwindcss`: Utility-first CSS framework
- `emoji-picker-react`: Emoji selection interface
- `react-animated-weather`: Weather widget animations

**Forms & Validation**:
- `react-hook-form`: Form state management
- `@hookform/resolvers`: Form validation integration
- `zod`: Schema validation

**Utilities**:
- `jspdf` & `html2canvas`: PDF generation
- `i18next` & `react-i18next`: Internationalization
- `wouter`: Lightweight routing
- `ws`: WebSocket support for database connection

**Development**:
- `@vitejs/plugin-react`: Vite React integration
- `eslint` & TypeScript ESLint: Code linting
- `jest` & `@testing-library/react`: Testing framework
- `autoprefixer` & `postcss`: CSS processing

### Environment Variables

**Required**:
- `DATABASE_URL`: PostgreSQL connection string (Neon)
- `VITE_SUPABASE_URL`: Supabase project URL
- `VITE_SUPABASE_ANON_KEY`: Supabase anonymous key

**Optional**:
- `RESEND_API_KEY`: For email delivery (Supabase environment)
- `OPENAI_API_KEY`: For AI Assistant (backend environment)

### Browser APIs

- **Service Worker**: PWA support (currently disabled in production)
- **LocalStorage**: Theme preferences, language selection, draft message persistence
- **Notification API**: Browser notifications for chat messages (permission-based)
- **Geolocation API**: Weather widget location detection