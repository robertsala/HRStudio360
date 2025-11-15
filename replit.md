# HR Studio 360

## Overview

HR Studio 360 is an AI-powered Human Resources management platform designed to streamline the entire employee lifecycle, from recruitment to offboarding. It offers comprehensive HR functionality, including hiring, employee management, payroll, performance reviews, benefits administration, time tracking, and analytics. The platform features a modular dashboard with over 40 specialized components, emphasizing user experience with celebration systems, real-time chat, and extensive customization. The project aims to provide an end-to-end HR solution, enhancing efficiency and employee engagement, and includes an enterprise-grade Applicant Tracking System (ATS) and an autonomous AI agent, "Studio AI," for tasks like candidate screening and hiring insights.

## Recent Changes

### v3.7.0 - Knowledge Base Relocation to Training Module (November 15, 2025)
- ✅ Moved Knowledge Base from dashboard to Training section as dedicated tab
- Knowledge Base now accessible via Training modal → Knowledge Base tab
- Cleaner dashboard interface with reduced widget clutter
- Updated widget counts: Employee (6), Manager (9), HR (10), Product Owner (11)
- Knowledge Base features fully preserved in new location (search, featured/popular/recent articles)
- Training modal enhanced with 5 tabs: Programs, Assessments, Certifications, Analytics, Knowledge Base

### v3.6.0 - Phase 2: Dashboard Widget Frontend Integration (November 15, 2025)
- ✅ Complete frontend integration of role-based customizable dashboard widgets
- Created `useDashboardWidgets` hook with centralized `renderWidget()` helper for unified widget visibility control
- All 12 registry widgets wrapped and integrated with backend visibility system
- Role-based widget counts verified: Employee (7), Manager (10), HR (11), Product Owner (12)
- New Compliance Alerts widget stub added for future implementation (HR/Product Owner only)
- Fixed critical bugs: userRole ReferenceError, widget ID mismatches, weather widget visibility
- Widget visibility optimized: compliance-alerts (HR/PO), ai-insights (Manager/PO) for correct role counts
- Dashboard loads without runtime errors, fully functional role-based widget system

### v3.5.0 - Phase 1: Role-Based Dashboard Widgets (November 15, 2025)
- ✅ Backend infrastructure complete for customizable dashboard widgets
- Database schema with `dashboard_widget_presets` and `user_dashboard_preferences` tables
- Widget registry system defining 11 dashboard widgets with role-based visibility
- Role-based defaults: Employee (7 widgets), Manager (10 widgets), HR (11 widgets)
- API endpoint `/api/dashboard/widgets` with merge logic (user prefs → role presets → registry defaults)
- isActive flag support allowing admins to deactivate widgets without code changes
- Architecture ready for Phase 2 (customization UI) and Phase 3 (visual improvements)

## User Preferences

- **Communication style**: Simple, everyday language.
- **Change Log**: Automatically add entries to the change log whenever completing new features, fixes, improvements, or system changes.

## System Architecture

### UI/UX Decisions

The frontend is a React 18 single-page application (SPA) with a modal-based interface. It uses Tailwind CSS for styling with dark mode support. Optimistic UI updates are employed for perceived performance.

### Technical Implementations

-   **Frontend**: Built with React 18, TypeScript, and Vite. Uses React Context for state management, Wouter for routing, and TanStack Query v5 for data fetching. Internationalization is supported via i18next.
-   **Backend**: Express.js server providing a RESTful API, using Drizzle ORM for type-safe database interactions.
-   **Data Storage**: PostgreSQL database (Neon-backed) with schema defined by Drizzle ORM.
-   **Authentication & Authorization**: Server-side sessions (`express-session`) with secure password-based authentication (Argon2id hashing, robust password requirements, progressive account lockout, rate limiting) and httpOnly cookies. Demo account access is passwordless.
-   **Real-time Features**: WebSocket-based chat system (`ws library`) with session-based authentication, real-time messaging, typing indicators, and presence tracking. Celebration badges and notifications are in migration.
-   **Paycheck Fun Facts**: Creative purchase comparison feature showing what paychecks could buy (e.g., "7 arcade sessions" or "12 craft coffees"). Migrated from Supabase to PostgreSQL with 3-per-day manual refresh limit. Database tracks templates, history, and daily usage. Smart rotation system prevents repeats by tracking last 10 shown facts per employee. Production seeding endpoint available at `/api/fun-facts/seed`.
-   **Change Log System**: Comprehensive change tracking with notification system, stats dashboard, and historical documentation. Fully populated with 20 historical entries documenting all major features from v1.0.0 to v3.2.0. Production seeding endpoint available at `/api/changelog/seed`.
-   **Collaboration Features**: Collaborator invitation system with database tracking, backend API, email notifications, in-app notifications, and AI-powered employee search.
-   **Dashboard Customization (v3.7.0)**: Fully integrated role-based customizable dashboard widgets system. Widget registry defines 11 widgets with role-based visibility (Employee: 6, Manager: 9, HR: 10, Product Owner: 11). Knowledge Base relocated to Training module as dedicated tab for cleaner dashboard. Frontend uses `useDashboardWidgets` hook with centralized `renderWidget()` for backend-controlled visibility. API endpoint `/api/dashboard/widgets` merges user preferences, role presets, and registry defaults. Database supports widget presets and user preferences with `isActive` flag for admin control. Compliance Alerts stub added for future implementation. All widgets wrapped and integrated with role-based access control. Seeding endpoint at `/api/dashboard/widgets/seed`.
-   **AI Integration**: Powered by OpenAI API (GPT-4o via Replit AI), it includes an AI Assistant, autonomous candidate screening, batch pipeline processing, hiring insights, and AI-powered employee search. The "Studio AI" agent operates autonomously, performing actions like candidate screening and generating insights.
-   **Design Patterns**: Heavily uses a modal-based interface, a service layer for business logic, optimistic UI updates, and error boundaries. Component extraction pattern used for reusability (e.g., `JobPostingsPanel` extracted from `JobManagementModal`).
-   **Testing Infrastructure**: Comprehensive testing suite with Jest and Testing Library for frontend unit and backend integration tests.
-   **Error Handling & Resilience**: Robust error handling with `ErrorBoundary`, centralized `logger` utility, `apiErrors` for parsing and user-friendly messages, and TanStack Query's smart retry logic.
-   **Production Monitoring**: Sentry integration for error tracking and performance monitoring.

### Feature Specifications

-   **ATS Module**: Public career portal for job browsing and application, including resume upload, AI-powered auto-fill, and object storage for files. Backend supports job postings, applications, candidates, interview stages, and offer letters across 11 new database tables and 20+ REST API endpoints.
    -   **Job Posting Management**: Extracted reusable `JobPostingsPanel` component for unified job posting management. Used in both `JobManagementModal` (legacy) and available for future integration into `HiringModal` via tab navigation.
    -   **Recruitment Interface**: `HiringModal` provides candidate pipeline management with kanban-style interface. Studio AI button provides contextual access to AI assistant for recruitment insights.
-   **Studio AI Agent**:
    -   **Capabilities**: Autonomous candidate screening (scoring, strengths/gaps), batch pipeline processing, hiring insights, natural language conversations about HR/recruitment, and manually triggered daily autonomous screening workflows.
    -   **User Interface**: Dedicated chat modal accessible from Dashboard, Job Management modal, and Hiring Pipeline modal via purple gradient "Ask Studio AI" buttons. Agent activity dashboard and prominent dashboard integration.

## External Dependencies

### Third-Party Services

-   **Resend**: Transactional email delivery.
-   **OpenAI**: AI functionalities (e.g., GPT-4o for Studio AI).
-   **Neon**: PostgreSQL database hosting.
-   **Sentry**: Error tracking and performance monitoring.

### NPM Dependencies

-   **Core**: `react`, `react-dom`, `typescript`, `vite`, `express`.
-   **Database**: `drizzle-orm`, `drizzle-kit`, `drizzle-zod`, `@neondatabase/serverless`.
-   **Auth/Security**: `argon2`, `express-rate-limit`, `express-session`.
-   **UI**: `lucide-react`, `tailwindcss`, `emoji-picker-react`, `react-animated-weather`.
-   **Forms**: `react-hook-form`, `@hookform/resolvers`, `zod`.
-   **Utilities**: `jspdf`, `html2canvas`, `i18next`, `react-i18next`, `wouter`, `ws`.