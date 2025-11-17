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
-   **Real-time Features**: WebSocket-based chat system (`ws library`) with session-based authentication, real-time messaging, typing indicators, and presence tracking. Celebration badges and notifications are integrated. Features robust message deduplication to prevent race conditions between WebSocket broadcasts and HTTP responses, user-friendly error notifications, and comprehensive error logging for debugging.
    -   **Enterprise Chat UI**: Professional custom chat interface built with Tailwind CSS components, providing Slack-quality user experience with:
        -   Clean message bubbles with proper alignment (right for outgoing, left for incoming)
        -   Visible timestamps below each message for better context
        -   Sender names and avatars with presence indicators (green dot for online)
        -   File message support with image previews and download links
        -   Animated typing indicators with bouncing dots
        -   Auto-resize textarea input with emoji picker integration
        -   Read receipts with checkmark icons
        -   Full dark mode support integrated with HRStudio360 design system
        -   Optimistic UI updates for instant message feedback
        -   Preserved functionality: AI Assistant welcome screen, WebSocket real-time updates, and channel management
    -   **Voice & Video Calling**: Enterprise-grade WebRTC-based calling system with PostgreSQL backend:
        -   Database schema with `callSessions`, `callParticipants`, and `callSignaling` tables for call state management
        -   7 comprehensive API endpoints for call lifecycle management (start, join, end, decline, signal exchange, incoming calls retrieval)
        -   Session-based authentication ensuring users can only access their own calls
        -   Polling-based signaling system (500ms interval) for WebRTC offer/answer/ICE candidate exchange
        -   Multi-participant support with per-user connection tracking
        -   Call session persistence with duration calculation and participant status tracking
        -   Fully migrated from Supabase to PostgreSQL with no external dependencies
-   **AI Integration**: Powered by OpenAI API (GPT-4o via Replit AI), the "Studio AI" agent provides:
    -   **Global AI Assistant**: Enterprise-wide conversational AI accessible via Enterprise Chat, capable of answering questions about HRStudio360 platform features, HR policies, workflows, and general work-related queries. Features conversation history support for contextual responses and uses a dedicated system profile (`00000000-0000-0000-0000-000000000000`) for message attribution. **Employee-aware capabilities**: The AI can now access and answer personalized questions about the logged-in user's HR data, including PTO balance, manager information, benefits enrollment, and timesheet summaries by querying the PostgreSQL database through secure session-based authentication.
    -   **Recruitment AI**: Autonomous candidate screening, batch pipeline processing, hiring insights, and AI-powered employee search.
    -   **Payroll AI**: AI Payroll Assistant for payroll validation, error detection, expense analysis, and tax configuration suggestions.
    -   AI capabilities are restricted to authorized roles (HR/Product Owner) with audit logging. The AI is context-aware, adapting its responses and routing based on the module currently in use.
-   **Dashboard Customization**: A role-based customizable dashboard widget system allows personalized views. A widget registry defines available widgets with role-based visibility, and an API endpoint `/api/dashboard/widgets` merges user preferences, role presets, and registry defaults.
-   **ATS Module**: Features a public career portal for job applications, including resume upload, AI-powered auto-fill, and object storage. The backend supports job postings, applications, candidates, interview stages, and offer letters. It includes a Kanban-style interface for pipeline management and contextual AI access for recruitment insights.
-   **Payroll System**: Features a guided payroll wizard with a 5-step workflow. Includes an AI Payroll Assistant for validation, error detection, and expense analysis. Interactive timesheet navigation allows direct access to Leave Management. Timesheet persistence and security are ensured through a three-table architecture (`timesheetEntries`, `timesheetApprovals`, `payrollLocks`) with server-side validation to prevent tampering.
-   **Access Control & Permissions**: Enterprise-grade granular permission system with a multi-table architecture supporting:
    -   Three-tier timesheet correction workflow with audit trails.
    -   Module-scoped permissions and role-based assignment.
    -   Advanced features including permission templates (AI-powered generation), role hierarchy with inheritance, time-based permission grants with auto-expiration, employee-initiated permission request workflows, and bulk operations.
    -   Enhanced audit trails with timeline visualization and CSV export.
    -   AI integration (GPT-4o) for smart permission suggestions, template generation, risk analysis, and role hierarchy recommendations.
    -   Comprehensive API endpoints with authorization and Zod validation, and robust database operations with transaction support.
-   **Tutorial System**: A comprehensive, role-based tutorial system integrated into the Training module's Knowledge Base, featuring step-by-step content, interactive checklists, progress tracking, and "Try it now" action buttons.
-   **AI-Assisted Tax Configuration**: Enterprise-grade multi-state tax data integration supporting AI-powered tax jurisdiction suggestions with human approval workflows.
    -   **Phase 1**: Database schema for tax data sources and AI suggestions. Manual encoding of authoritative data from IRS Publication 15-T and state reciprocal agreements. Hybrid AI-human model ensures compliance (SOC 1/SOX, IRS Circular 230).
    -   **Phase 2**: Studio AI integration with `SUGGEST_TAX_CONFIG` capability for intelligent tax jurisdiction suggestions using GPT-4o, analyzing employee work/residence states and reciprocal agreements. Includes functions for single and batch employee processing.
    -   **Phase 3**: Complete UI implementation for HR-driven AI tax suggestion workflow, including employee selection, generation of suggestions, and a review interface for pending suggestions with approve/reject actions.
-   **Design Patterns**: Utilizes a modal-based interface, a service layer for business logic, optimistic UI updates, and error boundaries.
-   **Testing Infrastructure**: Comprehensive testing suite with Jest and Testing Library for frontend unit and backend integration tests.
-   **Error Handling & Resilience**: Robust error handling with `ErrorBoundary`, centralized logging, and `apiErrors` for user-friendly messages.
-   **Production Monitoring**: Sentry integration for error tracking and performance monitoring.

### Feature Specifications

-   **Studio AI Agent**: Autonomous candidate screening, batch pipeline processing, hiring insights, and natural language conversations.
-   **Paycheck Fun Facts**: Creative purchase comparison feature with a smart rotation system.
-   **Change Log System**: Comprehensive change tracking with notification system, stats dashboard, and historical documentation.
-   **Collaboration Features**: Collaborator invitation system with database tracking, backend API, email notifications, in-app notifications, and AI-powered employee search.
-   **Profile Picture Management**: Dual upload system for profile pictures:
    -   **User Self-Service**: Employees can upload their own profile pictures through UserProfile modal with 5MB limit validation, image type checking, and progress indicators.
    -   **HR Administrative Upload**: HR staff can upload profile pictures for any employee through ComprehensiveEmployeeProfileModal, supporting Security Department workflow where onsite photos are emailed to HR for upload. Both systems use existing object storage service with public ACL for display.

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

## Recent Changes

### November 17, 2025 - AI Assistant Testing Environment & Navigation Improvements

**Test Environment Setup:**
-   Created CFO user account (Victor Martinez, EMP-CFO001) with complete employee profile and stock photo
-   Updated Robert Sala's employee record to report to Victor Martinez as manager
-   Created comprehensive leave balances for Robert: 15 days vacation, 6 days sick, 5 days personal for 2025
-   Added benefits field to employees schema and enrolled Robert in 6 benefits (Health, Dental, Vision, 401k, Life, Disability Insurance)

**AI Assistant Enhancements:**
-   Enhanced AI to retrieve benefits from employee records
-   AI can now answer personalized questions about enrolled benefits using actual employee data
-   All data access uses session-based authentication for security

**Navigation Improvements:**
-   Moved "My Profile" from user menu to main sidebar navigation
-   Positioned between Dashboard and Directory for better accessibility
-   Added bilingual support (English: "My Profile", Spanish: "Mi Perfil")

**Testing Ready:**
-   Robert Sala account fully configured for AI testing
-   Can test queries: "What's my PTO balance?", "Who is my manager?", "What benefits am I enrolled in?"