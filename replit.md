# Name Rankers - Study Space Platform

## Overview

Name Rankers is an educational study platform that provides students with a comprehensive learning environment. The application features a shared resource library, personal study vault for file storage, AI-powered tutoring with voice capabilities, and a community discussion forum. The platform includes role-based access control with student and admin roles, where admins can moderate content and manage users.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React with TypeScript, using Vite as the build tool
- **Routing**: Wouter for client-side navigation
- **State Management**: TanStack React Query for server state and caching
- **UI Components**: shadcn/ui component library built on Radix UI primitives
- **Styling**: Tailwind CSS with custom theme configuration and CSS variables for theming
- **Animations**: Framer Motion for page transitions and interactions
- **File Uploads**: Uppy with AWS S3 presigned URL flow

### Backend Architecture
- **Runtime**: Node.js with Express
- **Language**: TypeScript with ESM modules
- **API Design**: RESTful endpoints with Zod schema validation
- **Build Process**: Custom build script using esbuild for server, Vite for client

### Data Storage
- **Database**: PostgreSQL with Drizzle ORM
- **Schema Location**: `shared/schema.ts` contains all table definitions
- **Migrations**: Drizzle Kit with `db:push` command for schema synchronization
- **File Storage**: Google Cloud Storage via Replit Object Storage integration

### Authentication & Authorization
- **Auth Provider**: Replit Auth using OpenID Connect
- **Session Management**: Express sessions stored in PostgreSQL using connect-pg-simple
- **User Profiles**: Separate profiles table linking to auth users with role field (student/admin)
- **Admin Verification**: Passcode-based admin role upgrade system

### Key Data Models
- **profiles**: User profile data with username, bio, role, and ban status
- **libraryItems**: Shared educational resources (books, PDFs, question papers)
- **studyVaultItems**: User's private file storage
- **communityPosts/communityReplies**: Discussion forum with reactions
- **reports**: Content moderation reports

### API Structure
Routes are defined in `shared/routes.ts` using a typed API specification pattern with Zod schemas for input/output validation. The server implements these routes in `server/routes.ts`.

### Replit Integrations
The project uses several Replit platform integrations located in `server/replit_integrations/`:
- **auth**: Replit OpenID Connect authentication
- **chat**: AI chat functionality with conversation persistence
- **audio**: Voice recording and text-to-speech using OpenAI
- **image**: Image generation via OpenAI
- **object_storage**: Google Cloud Storage for file uploads
- **batch**: Utilities for rate-limited batch processing

## External Dependencies

### Database
- PostgreSQL database (provisioned via Replit)
- Connection via `DATABASE_URL` environment variable

### AI Services
- OpenAI API accessed through Replit AI Integrations proxy
- Used for: AI tutoring chat, voice transcription, text-to-speech, image generation
- Environment variables: `AI_INTEGRATIONS_OPENAI_API_KEY`, `AI_INTEGRATIONS_OPENAI_BASE_URL`

### File Storage
- Google Cloud Storage via Replit Object Storage
- Presigned URL upload flow for client-side file uploads
- Files accessible at `/api/uploads/` endpoints

### Authentication
- Replit OpenID Connect provider
- Requires `REPL_ID`, `ISSUER_URL`, `SESSION_SECRET` environment variables

### Third-Party Libraries
- **@tanstack/react-query**: Data fetching and caching
- **drizzle-orm**: Database ORM with type safety
- **zod**: Runtime schema validation
- **@uppy/core**: File upload management
- **framer-motion**: Animation library
- **passport**: Authentication middleware