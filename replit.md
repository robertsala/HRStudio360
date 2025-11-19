# HR Studio 360

## Overview

HR Studio 360 is an AI-powered Human Resources management platform designed to streamline the entire employee lifecycle, from recruitment to offboarding. It offers comprehensive HR functionality, including hiring, employee management, payroll, performance reviews, benefits administration, time tracking, and analytics. The platform features a modular dashboard with over 40 specialized components, emphasizing user experience with celebration systems, real-time chat, and extensive customization. The project aims to provide an end-to-end HR solution, enhancing efficiency and employee engagement, and includes an enterprise-grade Applicant Tracking System (ATS) and an autonomous AI agent, "Studio AI," for tasks like candidate screening and hiring insights.

## User Preferences

-   **Communication style**: Simple, everyday language.
-   **Change Log**: Automatically add entries to the change log whenever completing new features, fixes, improvements, or system changes.

## System Architecture

### UI/UX Decisions

The frontend is a React 18 single-page application (SPA) with a modal-based interface. It uses Tailwind CSS for styling with dark mode support. Optimistic UI updates are employed for perceived performance. The UI features a modular dashboard with role-based customizable widgets, a celebration system, and responsive layouts. Consistent button styling, spacing patterns, and a mobile-responsive grid are implemented.

### Technical Implementations

-   **Frontend**: Built with React 18, TypeScript, and Vite. Uses React Context for state management, Wouter for routing, and TanStack Query v5 for data fetching. Internationalization is supported via i18next.
-   **Backend**: Express.js server providing a RESTful API, using Drizzle ORM for type-safe database interactions.
-   **Data Storage**: PostgreSQL database (Neon-backed) with schema defined by Drizzle ORM. Database performance is optimized with strategic indexing.
-   **Authentication & Authorization**: Server-side sessions (`express-session`) with secure password-based authentication (Argon2id hashing, robust password requirements, progressive account lockout, rate limiting) and httpOnly cookies. Role-based access control (RBAC) is implemented with a granular permission system, including permission templates, role hierarchy, and time-based grants.
-   **Real-time Features**: WebSocket-based chat system (`ws library`) with session-based authentication, real-time messaging, typing indicators, presence tracking, and robust message deduplication. Includes an enterprise-grade WebRTC-based calling system.
-   **AI Integration**: Powered by OpenAI API (GPT-4o), the "Studio AI" agent provides a Global AI Assistant for contextual responses, Recruitment AI for candidate screening and hiring insights, and Payroll AI for validation and expense analysis. AI capabilities are role-restricted, auditable, and context-aware. AI also assists with permission suggestions and tax configuration.
-   **Dashboard Customization**: A role-based customizable dashboard widget system allows personalized views.
-   **Applicant Tracking System (ATS)**: Features a public career portal with resume upload and AI-powered auto-fill. The backend supports job postings, applications, candidates, interview stages, and offer letters with a Kanban-style interface.
-   **Payroll System**: Features a guided 5-step payroll wizard with an AI Payroll Assistant and interactive timesheet navigation.
-   **Onboarding System**: Comprehensive end-to-end onboarding infrastructure including:
    -   **Database**: Complete schema for checklists, tasks, I-9 forms (federal compliance), state tax forms, and onboarding documents
    -   **API**: 25+ RESTful endpoints for onboarding workflows, form submissions, and document management
    -   **Components**: 4 production-ready form components (I-9 Section 1 & 2, Massachusetts M-4, document upload with object storage)
    -   **Modal Interface**: Fully integrated NewHireOnboardingModal with 4-tab navigation (Overview, Forms & Compliance, Documents, Tasks), role-based access control, real-time progress tracking, and hierarchical TanStack Query cache invalidation
    -   **Federal Compliance**: Complete I-9 verification workflow supporting all 50 states and US territories with conditional validation (List A OR List B+C documents)
-   **Design Patterns**: Utilizes a modal-based interface, a service layer for business logic, optimistic UI updates, and error boundaries.
-   **Testing Infrastructure**: Comprehensive testing suite with Jest and Testing Library.
-   **Error Handling & Resilience**: Robust error handling with `ErrorBoundary`, centralized logging, and `apiErrors`.
-   **Production Monitoring**: Sentry integration for error tracking and performance monitoring.
-   **Production Deployment**: Configured for VM deployment to support native Node.js modules, with a `/health` endpoint for monitoring.

### Feature Specifications

-   **Studio AI Agent**: Autonomous candidate screening, batch pipeline processing, hiring insights, and natural language conversations.
-   **Paycheck Fun Facts**: Creative purchase comparison feature with a smart rotation system.
-   **Change Log System**: Comprehensive change tracking with notification system and stats dashboard.
-   **Collaboration Features**: Collaborator invitation system with database tracking, API, email/in-app notifications, and AI-powered employee search.
-   **Profile Picture Management**: Dual upload system for user self-service and HR administrative uploads.
-   **Role-Based Profile Viewing**: Granular access to employee profile data based on user roles (e.g., HR/Product Owner vs. regular employee).
-   **User Impersonation**: "View As" feature for HR/Product Owner to impersonate employees for troubleshooting.
-   **Tutorial System**: Role-based tutorials integrated into the Training module with interactive checklists and progress tracking.
-   **AI-Assisted Tax Configuration**: Enterprise-grade multi-state tax data integration with AI-powered jurisdiction suggestions and human approval workflows.

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