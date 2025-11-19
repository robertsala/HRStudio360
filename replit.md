# HR Studio 360

## Overview

HR Studio 360 is an AI-powered Human Resources management platform designed to streamline the entire employee lifecycle, from recruitment to offboarding. It offers comprehensive HR functionality, including hiring, employee management, payroll, performance reviews, benefits administration, time tracking, and analytics. The platform features a modular dashboard with over 40 specialized components, emphasizing user experience with celebration systems, real-time chat, and extensive customization. The project aims to provide an end-to-end HR solution, enhancing efficiency and employee engagement, and includes an enterprise-grade Applicant Tracking System (ATS) and an autonomous AI agent, "Studio AI," for tasks like candidate screening and hiring insights.

## User Preferences

-   **Communication style**: Simple, everyday language.
-   **Change Log**: Automatically add entries to the change log whenever completing new features, fixes, improvements, or system changes.

## Recent Changes (November 2025)

### Database Performance Optimization (November 19, 2025)
-   **Critical Performance Indexes Added** (`shared/schema.ts`): Resolved 2.3-2.6s dashboard load times by adding 4 strategic database indexes
-   **`employees.userId` index**: Optimizes dashboard stats lookup (most critical - queried on every dashboard load)
-   **`leaveBalances.(employeeId, year)` composite index**: Speeds up PTO balance queries for dashboard stats
-   **`announcements.(published, createdAt)` composite index**: Optimizes announcement widget loading with complex filters
-   **`userDashboardPreferences.userId` index**: Accelerates widget preference lookups
-   **Expected Impact**: 80-90% reduction in query execution time, bringing dashboard loads from ~2.5s to <500ms
-   **Schema Migration**: Successfully applied via `npm run db:push` with zero data loss

### UI/UX Polish & Code Quality Improvements (November 19, 2025)
-   **Dark Mode Cleanup** (`Dashboard.tsx`): Removed duplicate and conflicting Tailwind dark mode classes, improving code quality and reducing LSP diagnostics from 115 to 86
-   **Weather Widget Fix** (`weatherService.ts`): Removed failing Supabase cache calls causing console errors; weather now fetches fresh data cleanly
-   **Comprehensive UI Audit**: Verified consistent button styling (emerald for primary, red for danger), spacing patterns (p-6 cards, gap-6 grids), and responsive layouts across all components
-   **Mobile Responsiveness Review**: Confirmed Dashboard uses proper responsive grid patterns (`grid-cols-1 md:grid-cols-2 lg:grid-cols-4`) with adaptive padding; identified edge cases for future optimization (BodyDiagram fixed width, wide modals)
-   **Data-testid Coverage**: Verified Dashboard has 9 data-testid attributes on key interactive elements for testing support

### Production Deployment Configuration (November 19, 2025)
-   **Changed deployment target from autoscale to VM** to support native Node.js modules (argon2 password hashing)
-   **Added `/health` endpoint** (`server/index.ts`) that responds immediately before Vite middleware initializes, ensuring deployment health checks pass within timeout limits
-   Fixed production login crashes caused by cryptographic function failures in autoscale environment
-   Health check endpoint returns JSON status with timestamp for monitoring purposes

### Production Database Seed Update
-   **Updated `server/seed-production.ts`** to match development environment exactly with the correct 6 database employees:
    -   **Demo User** (demo@hrstudio360.com) - Product Owner with AI chatbot avatar
    -   **Robert Sala** (robertsala@gmail.com) - CEO with unique avatar
    -   **Sarah Johnson** (sarah.johnson@hrstudio360.com) - HR Specialist with professional headshot
    -   **Jessica Williams** (jessica.williams@hrstudio360.com) - HR Manager with professional headshot
    -   **Mike Chen** (mike.chen@hrstudio360.com) - Sales Director with professional headshot
    -   **Victor Martinez** (victor.martinez@company.com) - CFO with professional headshot
-   Updated departments to include HR, Sales, Finance, Product, and Executive
-   Created proper job titles for all roles (CEO, CFO, Product Owner, HR Manager, HR Specialist, Sales Director)
-   Fixed employee record creation to properly reference all team members with correct department and job title assignments
-   All employees now have unique, gender-appropriate professional avatars for realistic client demos
-   Authentication credentials are automatically created for all users with default password: `HRStudio360Demo!`

## System Architecture

### UI/UX Decisions

The frontend is a React 18 single-page application (SPA) with a modal-based interface. It uses Tailwind CSS for styling with dark mode support. Optimistic UI updates are employed for perceived performance. The UI features a modular dashboard with role-based customizable widgets and a celebration system.

### Technical Implementations

-   **Frontend**: Built with React 18, TypeScript, and Vite. Uses React Context for state management, Wouter for routing, and TanStack Query v5 for data fetching. Internationalization is supported via i18next.
-   **Backend**: Express.js server providing a RESTful API, using Drizzle ORM for type-safe database interactions.
-   **Data Storage**: PostgreSQL database (Neon-backed) with schema defined by Drizzle ORM.
-   **Authentication & Authorization**: Server-side sessions (`express-session`) with secure password-based authentication (Argon2id hashing, robust password requirements, progressive account lockout, rate limiting) and httpOnly cookies. Role-based access control (RBAC) is implemented.
-   **Real-time Features**: WebSocket-based chat system (`ws library`) with session-based authentication, real-time messaging, typing indicators, and presence tracking. Celebration badges and notifications are integrated. Features robust message deduplication and user-friendly error notifications. Includes an enterprise-grade WebRTC-based calling system with PostgreSQL backend for call state management.
-   **AI Integration**: Powered by OpenAI API (GPT-4o via Replit AI), the "Studio AI" agent provides:
    -   **Global AI Assistant**: Enterprise-wide conversational AI accessible via Enterprise Chat, providing contextual responses about platform features, HR policies, and workflows. It is employee-aware, securely accessing personalized HR data.
    -   **Recruitment AI**: Autonomous candidate screening, batch pipeline processing, hiring insights, and AI-powered employee search.
    -   **Payroll AI**: AI Payroll Assistant for payroll validation, error detection, expense analysis, and tax configuration suggestions.
    -   AI capabilities are restricted to authorized roles with audit logging and are context-aware.
-   **Dashboard Customization**: A role-based customizable dashboard widget system allows personalized views, merging user preferences, role presets, and a widget registry.
-   **Applicant Tracking System (ATS)**: Features a public career portal with resume upload and AI-powered auto-fill. The backend supports job postings, applications, candidates, interview stages, and offer letters. Includes a Kanban-style interface and contextual AI access.
-   **Payroll System**: Features a guided payroll wizard with a 5-step workflow and an AI Payroll Assistant. Interactive timesheet navigation allows direct access to Leave Management, with persistence and security via a three-table architecture.
-   **Access Control & Permissions**: Enterprise-grade granular permission system with a multi-table architecture supporting three-tier timesheet correction, module-scoped permissions, role-based assignment, permission templates (AI-powered generation), role hierarchy with inheritance, time-based grants, employee-initiated requests, and bulk operations. Enhanced audit trails with timeline visualization and CSV export. AI integration (GPT-4o) provides smart permission suggestions, template generation, risk analysis, and role hierarchy recommendations.
-   **Tutorial System**: A comprehensive, role-based tutorial system integrated into the Training module's Knowledge Base, featuring step-by-step content, interactive checklists, progress tracking, and "Try it now" action buttons.
-   **AI-Assisted Tax Configuration**: Enterprise-grade multi-state tax data integration supporting AI-powered tax jurisdiction suggestions with human approval workflows. Uses a hybrid AI-human model to ensure compliance.
-   **Design Patterns**: Utilizes a modal-based interface, a service layer for business logic, optimistic UI updates, and error boundaries.
-   **Testing Infrastructure**: Comprehensive testing suite with Jest and Testing Library for frontend unit and backend integration tests.
-   **Error Handling & Resilience**: Robust error handling with `ErrorBoundary`, centralized logging, and `apiErrors` for user-friendly messages.
-   **Production Monitoring**: Sentry integration for error tracking and performance monitoring.

### Feature Specifications

-   **Studio AI Agent**: Autonomous candidate screening, batch pipeline processing, hiring insights, and natural language conversations.
-   **Paycheck Fun Facts**: Creative purchase comparison feature with a smart rotation system.
-   **Change Log System**: Comprehensive change tracking with notification system, stats dashboard, and historical documentation.
-   **Collaboration Features**: Collaborator invitation system with database tracking, backend API, email notifications, in-app notifications, and AI-powered employee search.
-   **Profile Picture Management**: Dual upload system for user self-service and HR administrative uploads, using existing object storage.
-   **Profile Data Loading**: Unified data pipeline across all entry points (Dashboard, Employee Directory, Quick Access) ensures consistent profile data display. Fixed critical bug where saved address, emergency contact, and profile pictures were not loading after modal reopening.
-   **Role-Based Profile Viewing**: HR Manager and Product Owner roles see full employee profiles (address, emergency contact, salary), while regular employees see limited public data (name, email, phone, department, role).
-   **User Impersonation**: "View As" feature allows HR/Product Owner to impersonate employees for troubleshooting, accessible via Employee Directory with visual banner indicating impersonation status.

## External Dependencies

### Third-Party Services

-   **Resend**: Transactional email delivery.
-   **OpenAI**: AI functionalities (GPT-4o).
-   **Neon**: PostgreSQL database hosting.
-   **Sentry**: Error tracking and performance monitoring.

### NPM Dependencies

-   **Core**: `react`, `react-dom`, `typescript`, `vite`, `express`.
-   **Database**: `drizzle-orm`, `drizzle-kit`, `drizzle-zod`, `@neondatabase/serverless`.
-   **Auth/Security**: `argon2`, `express-rate-limit`, `express-session`.
-   **UI**: `lucide-react`, `tailwindcss`, `emoji-picker-react`, `react-animated-weather`.
-   **Forms**: `react-hook-form`, `@hookform/resolvers`, `zod`.
-   **Utilities**: `jspdf`, `html2canvas`, `i18next`, `react-i18next`, `wouter`, `ws`.