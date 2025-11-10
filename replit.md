# HR Studio 360

## Overview

HR Studio 360 is an AI-powered Human Resources management platform designed to streamline the entire employee lifecycle, from recruitment to offboarding. It offers comprehensive HR functionality, including hiring, employee management, payroll, performance reviews, benefits administration, time tracking, and analytics. The platform features a modular dashboard with over 40 specialized components, emphasizing user experience with celebration systems, real-time chat, and extensive customization. The project aims to provide an end-to-end HR solution, enhancing efficiency and employee engagement.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

The frontend is a React 18 single-page application (SPA) built with TypeScript and Vite. State management relies on React Context for authentication and theming, with component-level state managed via hooks. Wouter handles client-side routing, with authentication guards for protected routes. The UI is modular, featuring over 60 modal components managed by `Dashboard.tsx` for visibility and communication. Styling uses Tailwind CSS with dark mode support, and custom CSS animations for celebrations. Internationalization is implemented via i18next, supporting English and Spanish.

**TanStack Query Configuration**: The app uses TanStack Query v5 for data fetching with a default query function configured in `src/lib/queryClient.ts` that automatically fetches from backend API endpoints. The `apiRequest` helper function is exported for mutations.

### Backend Architecture

The backend consists of an Express.js server running on port 5000, integrated with Vite. It provides a RESTful API for all HR functionalities across 29 database tables. The API interacts with the database through an `IStorage` interface, implemented by `DbStorage` using Drizzle ORM for type-safe queries. Authentication has been fully migrated to the Express backend, handling login, logout, and session management.

### Data Storage

The project uses a PostgreSQL database (Neon-backed), with its schema defined using Drizzle ORM. Key tables include `profiles`, `employees`, `leave_requests`, `pay_stubs`, `celebration_badges`, `channels`, `performance_reviews`, and `announcements`. The `profiles` table includes location fields (locationLat, locationLon, locationCity, locationState, locationZipCode, locationManualOverride) for weather widget functionality, plus `canAccessOrgChart` and `managerId` fields for permission management and organizational hierarchy. Drizzle Kit manages database migrations. The backend provides a complete RESTful API for all tables, with frontend components gradually migrating from direct Supabase client access to this new API.

**Dashboard API Migration** (November 2025): Complete migration of dashboard components from direct Supabase calls to backend REST API endpoints:
- **Statistics Endpoint**: Single consolidated `/api/dashboard/stats` endpoint provides real-time metrics (PTO balance, next payday, pending tasks, team size, upcoming events) with proper userId filtering
- **Announcements Endpoint**: `/api/announcements?limit=N` returns published announcements with validation (1-100 range), date-window filtering for active announcements only
- **Permissions Endpoint**: `/api/profiles/:id/permissions` returns user permissions with safe defaults for org chart access
- **Loading States**: Comprehensive skeleton loaders with animate-pulse animations prevent empty content flashes during data fetching
- **TanStack Query Integration**: All dashboard data uses TanStack Query v5 with proper caching (5-10 min staleTime), automatic refetching, and loading state management
- **Error Handling**: Robust validation in API layer (400 for invalid params, 500 for server errors) with graceful UI degradation

### Authentication & Authorization

Authentication has been fully migrated from Supabase Auth to the backend Express API. `AuthContext` manages authentication state using backend endpoints for session validation and refresh, including retry logic and expiry warnings. An impersonation feature allows administrators to view the application as other users.

**Session Management** (November 2025): Implemented server-side session management using `express-session` to persist user authentication across requests. Sessions store user ID and regenerate on login to prevent fixation attacks. Cookie settings include httpOnly, sameSite protection, and 7-day expiration. Weather widget location updates and profile modifications no longer invalidate sessions.

### Real-time Features

The system includes an enterprise chat system with channels, direct messages, and reactions, currently using Supabase Realtime for live updates. It also features a celebration system for birthdays and anniversaries with full-screen modals and notifications, and a general real-time notification system.

### Collaboration Features

**Collaborator Invitation System** (November 2025): Complete end-to-end implementation with backend API and frontend UI, enabling users to invite team members to collaborate on projects. Features include:
- **Database**: `collaborator_invitations` table with status tracking (pending/accepted/declined) and timestamps
- **Backend API**: Three RESTful endpoints for create, accept, and decline operations with proper validation
- **Email Notifications**: Resend integration sends invitation emails and acceptance confirmations with graceful error handling
- **In-app Notifications**: Real-time notifications via NotificationCenter for invite sent and accepted events
- **AI-Powered Search**: Smart employee search utility (`src/utils/employeeSearch.ts`) enables finding team members by name, role, department, or location with contextual matching
- **Enhanced Employee Selection** (November 2025): Multi-select interface with intelligent filters and batch invitation sending:
  - **Filter Options**: Segmented controls for All Employees, My Team (manager-based with department fallback), and Department filtering
  - **Interactive Grid**: Checkbox-based multi-select with visual feedback, avatars, and employee details
  - **Batch Operations**: Send invitations to multiple employees simultaneously with Promise.allSettled for robust error handling
  - **Smart Persistence**: Selected employees remain selected across filter/search changes and retry on partial failures
  - **Contextual Empty States**: Clear messaging for each filter scenario (no team members, select department, no search results)
- **CollaboratorModal**: Full-featured React component with sent/received invitation lists, multi-select employee picker, and bidirectional confirmation flow
- **React Query Integration**: Optimistic updates and automatic cache invalidation ensure real-time UI consistency

### AI Integration

AI capabilities are integrated via an AI Assistant, powered by OpenAI API, offering HR policy guidance and employee information lookup. Additional AI features include candidate screening scores, predictive analytics, automated insights, and AI-powered employee search for collaboration workflows.

### File Processing

File processing includes client-side PDF generation using jspdf and html2canvas for reports, and avatar generation for profile pictures. Receipt OCR for expense management is planned for migration.

### Design Patterns

The system heavily utilizes a modal-based interface for primary interactions. A service layer pattern encapsulates business logic, and optimistic UI updates are employed for perceived performance. Error boundaries are used for graceful error handling.

### Error Handling & Resilience

**Comprehensive Error Handling System** (November 2025): Production-ready error handling infrastructure for improved reliability and user experience:

- **ErrorBoundary Component** (`src/components/ErrorBoundary.tsx`): Reusable React error boundary with fallback UI, retry capabilities, and component name tracking. Integrated with centralized logger for error monitoring. Root boundary in `main.tsx` catches catastrophic errors, with architecture supporting sectional boundaries for high-risk areas.

- **Centralized Logger** (`src/utils/logger.ts`): Unified logging interface with methods for error, warn, info, and debug levels. Specialized methods for component errors (`componentError`) and API errors (`apiError`) with contextual metadata. Ready for future integration with monitoring services (Sentry, LogRocket).

- **API Error Utilities** (`src/utils/apiErrors.ts`):
  - `parseApiError()`: Standardized parsing of HTTP error responses into structured ApiError objects
  - `getUserFriendlyErrorMessage()`: Converts technical errors to user-friendly messages
  - `handleApiError()`: Combined error handling with automatic logging
  - `retryWithBackoff()`: Exponential backoff utility for retry operations
  - `isApiError()`: Type guard that distinguishes custom ApiError objects from native Error/TypeError using status/code discriminators
  - `HttpStatus` helpers: Constants and utilities for HTTP status code handling

- **Enhanced TanStack Query** (`src/lib/queryClient.ts`):
  - Smart retry logic: Retries server errors (5xx) and network errors, skips client errors (4xx)
  - Exponential backoff: 1s → 2s → 4s delay between retries, max 30 seconds
  - Network error handling: TypeError from fetch failures wrapped in friendly "Network error. Please check your connection" message
  - Comprehensive logging: All API errors logged with endpoint, method, and error details
  - Proper error discrimination: Uses `isApiError()` type guard to distinguish API errors from network failures

- **Error Flow Architecture**:
  1. HTTP errors (4xx/5xx): Parsed into ApiError with status → logged → rethrown with original message
  2. Network failures: TypeError caught → logged as network_error → wrapped in user-friendly message
  3. React component errors: Caught by ErrorBoundary → logged with component name → fallback UI displayed
  4. All errors tracked via centralized logger for future monitoring integration

## External Dependencies

### Third-Party Services

-   **Supabase**: Currently used for real-time subscriptions, file storage, and some edge functions (e.g., onboarding email, AI chat functions), with plans for replacement by the self-hosted backend.
-   **Resend**: For transactional email delivery (e.g., onboarding notifications) via a Supabase Edge Function.
-   **OpenAI**: Powers the AI Assistant's chat functionality.
-   **Neon**: Provides PostgreSQL database hosting.

### NPM Dependencies

-   **Core Framework**: `react`, `react-dom`, `typescript`, `vite`, `express`.
-   **Database & ORM**: `drizzle-orm`, `drizzle-kit`, `drizzle-zod`, `@neondatabase/serverless`.
-   **Supabase Client**: `@supabase/supabase-js`.
-   **UI Libraries**: `lucide-react`, `tailwindcss`, `emoji-picker-react`, `react-animated-weather`.
-   **Forms & Validation**: `react-hook-form`, `@hookform/resolvers`, `zod`.
-   **Utilities**: `jspdf`, `html2canvas`, `i18next`, `react-i18next`, `wouter`, `ws`.

### Environment Variables

-   **Required**: `DATABASE_URL`, `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`.
-   **Optional**: `RESEND_API_KEY`, `OPENAI_API_KEY`.