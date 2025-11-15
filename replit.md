# HR Studio 360

## Overview

HR Studio 360 is an AI-powered Human Resources management platform designed to streamline the entire employee lifecycle, from recruitment to offboarding. It offers comprehensive HR functionality, including hiring, employee management, payroll, performance reviews, benefits administration, time tracking, and analytics. The platform features a modular dashboard with over 40 specialized components, emphasizing user experience with celebration systems, real-time chat, and extensive customization. The project aims to provide an end-to-end HR solution, enhancing efficiency and employee engagement, and includes an enterprise-grade Applicant Tracking System (ATS) and an autonomous AI agent, "Studio AI," for tasks like candidate screening and hiring insights.

## User Preferences

-   **Communication style**: Simple, everyday language.
-   **Change Log**: Automatically add entries to the change log whenever completing new features, fixes, improvements, or system changes.

## System Architecture

### UI/UX Decisions

The frontend is a React 18 single-page application (SPA) with a modal-based interface. It uses Tailwind CSS for styling with dark mode support. Optimistic UI updates are employed for perceived performance. The UI features a modular dashboard with role-based customizable widgets and a celebration system.

### Technical Implementations

-   **Frontend**: Built with React 18, TypeScript, and Vite. Uses React Context for state management, Wouter for routing, and TanStack Query v5 for data fetching. Internationalization is supported via i18next.
-   **Backend**: Express.js server providing a RESTful API, using Drizzle ORM for type-safe database interactions.
-   **Data Storage**: PostgreSQL database (Neon-backed) with schema defined by Drizzle ORM.
-   **Authentication & Authorization**: Server-side sessions (`express-session`) with secure password-based authentication (Argon2id hashing, robust password requirements, progressive account lockout, rate limiting) and httpOnly cookies. Role-based access control (RBAC) is implemented for features and API endpoints.
-   **Real-time Features**: WebSocket-based chat system (`ws library`) with session-based authentication, real-time messaging, typing indicators, and presence tracking. Celebration badges and notifications are integrated.
-   **AI Integration**: Powered by OpenAI API (GPT-4o via Replit AI), the "Studio AI" agent provides an AI Assistant, autonomous candidate screening, batch pipeline processing, hiring insights, AI-powered employee search, and an AI Payroll Assistant. It operates autonomously across recruitment and payroll modules, performing actions like candidate screening, payroll validation, expense analysis, and generating insights. AI capabilities are restricted to authorized roles (HR/Product Owner) with audit logging. The AI is context-aware, adapting its responses and routing based on the module currently in use.
-   **Dashboard Customization**: A role-based customizable dashboard widget system allows personalized views. A widget registry defines available widgets with role-based visibility, and an API endpoint `/api/dashboard/widgets` merges user preferences, role presets, and registry defaults. The Knowledge Base is integrated into the Training module for a cleaner dashboard.
-   **ATS Module**: Features a public career portal for job applications, including resume upload, AI-powered auto-fill, and object storage. The backend supports job postings, applications, candidates, interview stages, and offer letters. It includes a Kanban-style interface for pipeline management and contextual AI access for recruitment insights.
-   **Payroll System**: Features a guided payroll wizard with a 5-step workflow for reviewing timesheets, expenses, leave requests, validating calculations, and final submission. An AI Payroll Assistant validates calculations, detects errors, analyzes expense compliance, and provides conversational assistance. **Interactive Timesheet Navigation**: PTO and Sick Hours summary cards and daily breakdown table rows are clickable, allowing HR to navigate directly from employee timesheets to the Leave Management modal with pre-filtered results (by employee, date, and leave type), streamlining the approval workflow. **Timesheet Persistence & Security**: Production-ready timesheet system with three-table architecture (`timesheetEntries`, `timesheetApprovals`, `payrollLocks`) ensuring all payroll hours are sourced from approved timesheets stored in the database. PayrollModal Step 1 requires HR to save timesheets before AI analysis can proceed. Auto-fix approval validates all affected employees have approved timesheets for a consistent pay period, preventing client-side manipulation of hours, gross pay, or pay periods. Server-side validation blocks all tampering vectors by enforcing database-derived pay periods and hours.
-   **Access Control & Permissions (Phase 1)**: Enterprise-grade granular permission system with four-table architecture (`permissions`, `rolePermissions`, `timesheetCorrectionRequests`, `timesheetChangeAudit`). Features a three-tier correction workflow: (1) Employee self-edit requests with mandatory justification, (2) Manager/HR approval with review notes, (3) Complete audit trail for all timesheet changes. **Atomic Transactions**: Correction approval/rejection operations use database transactions to ensure all-or-nothing semantics - request status, timesheet updates, and audit entries are created atomically, guaranteeing data consistency and preventing race conditions. **Permission Catalog**: Supports module-scoped permissions (e.g., `timesheets.view_own`, `timesheets.submit_corrections`, `timesheets.approve_team`) with role-based assignment. **API Security**: 13 new endpoints with role-based authorization (HR/Product Owner for permission management, Manager/HR for correction approvals), comprehensive validation, and proper error handling.
-   **Tutorial System**: A comprehensive, role-based tutorial system integrated into the Training module's Knowledge Base, featuring step-by-step content, interactive checklists, progress tracking, and "Try it now" action buttons.
-   **Design Patterns**: Utilizes a modal-based interface, a service layer for business logic, optimistic UI updates, and error boundaries.
-   **Testing Infrastructure**: Comprehensive testing suite with Jest and Testing Library for frontend unit and backend integration tests.
-   **Error Handling & Resilience**: Robust error handling with `ErrorBoundary`, centralized logging, and `apiErrors` for user-friendly messages.
-   **Production Monitoring**: Sentry integration for error tracking and performance monitoring.

### Feature Specifications

-   **Studio AI Agent**: Capabilities include autonomous candidate screening (scoring, strengths/gaps), batch pipeline processing, hiring insights, and natural language conversations. Accessible via dedicated chat modals and dashboard integration.
-   **Paycheck Fun Facts**: Creative purchase comparison feature showing what paychecks could buy, with a smart rotation system to prevent repeats.
-   **Change Log System**: Comprehensive change tracking with notification system, stats dashboard, and historical documentation.
-   **Collaboration Features**: Collaborator invitation system with database tracking, backend API, email notifications, in-app notifications, and AI-powered employee search.

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