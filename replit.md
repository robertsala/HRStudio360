# HR Studio 360

## Overview

HR Studio 360 is an AI-powered Human Resources management platform designed to streamline the entire employee lifecycle, from recruitment to offboarding. It offers comprehensive HR functionality, including hiring, employee management, payroll, performance reviews, benefits administration, time tracking, and analytics. The platform features a modular dashboard with over 40 specialized components, emphasizing user experience with celebration systems, real-time chat, and extensive customization. The project aims to provide an end-to-end HR solution, enhancing efficiency and employee engagement, and includes an enterprise-grade Applicant Tracking System (ATS) and an autonomous AI agent, "Studio AI," for tasks like candidate screening and hiring insights.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### UI/UX Decisions

The frontend is a React 18 single-page application (SPA) with a modal-based interface. It uses Tailwind CSS for styling with dark mode support. Optimistic UI updates are employed for perceived performance.

### Technical Implementations

-   **Frontend**: Built with React 18, TypeScript, and Vite. Uses React Context for state management, Wouter for routing, and TanStack Query v5 for data fetching. Internationalization is supported via i18next.
-   **Backend**: Express.js server providing a RESTful API, using Drizzle ORM for type-safe database interactions.
-   **Data Storage**: PostgreSQL database (Neon-backed) with schema defined by Drizzle ORM.
-   **Authentication & Authorization**: Server-side sessions (`express-session`) with secure password-based authentication (Argon2id hashing, robust password requirements, progressive account lockout, rate limiting) and httpOnly cookies. Demo account access is passwordless.
-   **Real-time Features**: WebSocket-based chat system (`ws library`) with session-based authentication, real-time messaging, typing indicators, and presence tracking. Celebration badges and notifications are in migration.
-   **Paycheck Fun Facts**: Creative purchase comparison feature showing what paychecks could buy (e.g., "7 arcade sessions" or "12 craft coffees"). Migrated from Supabase to PostgreSQL with 3-per-day manual refresh limit. Database tracks templates, history, and daily usage. Core functionality restored; future improvements planned for history-based fact exclusion to prevent repeats.
-   **Collaboration Features**: Collaborator invitation system with database tracking, backend API, email notifications, in-app notifications, and AI-powered employee search.
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