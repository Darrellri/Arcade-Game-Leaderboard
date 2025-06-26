# Arcade Leaderboard Application

## Overview

This is a full-stack arcade leaderboard application built with Express.js backend and React frontend. The system allows arcade/pinball game operators to manage games and enables players to submit high scores with location verification. The application features a modern UI with theming capabilities and supports both arcade and pinball games.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite for fast development and optimized builds
- **Styling**: TailwindCSS with shadcn/ui component library
- **State Management**: TanStack Query for server state management
- **Routing**: Wouter for lightweight client-side routing
- **UI Components**: Radix UI primitives with custom theming
- **Image Handling**: File upload with preview capabilities

### Backend Architecture
- **Framework**: Express.js with TypeScript
- **Database**: PostgreSQL with Drizzle ORM
- **Database Provider**: Neon serverless PostgreSQL
- **File Storage**: Local file system for uploaded images
- **API Design**: RESTful endpoints with JSON responses
- **Development**: Hot reload with tsx for server-side development

### Project Structure
```
├── client/          # React frontend application
├── server/          # Express.js backend
├── shared/          # Shared TypeScript schemas and types
├── public/          # Static assets and uploaded files
├── scripts/         # Database management scripts
└── migrations/      # Database schema migrations
```

## Key Components

### Database Schema (Drizzle ORM)
- **games**: Game metadata, high scores, display order
- **scores**: Individual score submissions with location data
- **venue_settings**: Configurable venue branding and themes

### Frontend Pages
- **Home**: Game gallery with sortable display and theme customization
- **Scan**: QR code scanner for game identification
- **Submit Score**: Score submission form with location verification
- **Leaderboard**: Individual game score displays
- **Admin**: Game management and venue configuration

### Backend Services
- **Database Storage**: Abstracted storage interface with PostgreSQL implementation
- **File Upload**: Multer-based image upload handling
- **Location Services**: Geolocation verification for score submissions

## Data Flow

### Score Submission Flow
1. Player scans QR code or manually enters game ID
2. Score form captures player details and location
3. Server validates submission and updates game high score if applicable
4. Database stores score with timestamp and location data
5. Client redirects to updated leaderboard

### Game Management Flow
1. Admin adds/edits games through management interface
2. Image uploads are processed and stored locally
3. Game ordering is maintained through drag-and-drop interface
4. Real-time updates reflect changes across all clients

### Theme System Flow
1. Venue settings store theme configuration in database
2. Theme context provides real-time theme updates to all components
3. CSS custom properties are dynamically updated
4. Theme presets allow quick style switching

## External Dependencies

### Database Integration
- **Neon PostgreSQL**: Serverless database hosting
- **Drizzle ORM**: Type-safe database operations
- **Connection Pooling**: HTTP-based connections for stability

### Frontend Libraries
- **TanStack Query**: Server state management and caching
- **React Hook Form**: Form validation and submission
- **Zod**: Runtime type validation
- **DND Kit**: Drag and drop functionality for admin interface
- **QR Scanner**: Camera-based QR code reading

### File Upload System
- **Multer**: Multipart form data handling
- **Sharp**: Image processing and optimization
- **Local Storage**: File system storage for uploaded images

### UI Framework
- **Radix UI**: Accessible component primitives
- **Tailwind CSS**: Utility-first styling
- **Lucide React**: Icon library
- **Class Variance Authority**: Component variant management

## Deployment Strategy

### Development Environment
- **Hot Reload**: Vite development server with backend proxy
- **Type Checking**: Shared TypeScript configuration
- **Database**: Neon development database with migration scripts

### Production Build
- **Frontend**: Vite builds to static files served by Express
- **Backend**: esbuild bundles server code for Node.js execution
- **Database**: Production Neon database with environment-based configuration
- **File Storage**: Public directory serves uploaded images

### Replit Deployment
- **Modules**: Node.js 20, PostgreSQL 16, web interface
- **Port Configuration**: Express serves on port 5000, external port 80
- **Build Process**: npm run build creates production assets
- **Start Command**: NODE_ENV=production node dist/index.js

### Environment Variables
- **DATABASE_URL**: Neon PostgreSQL connection string (required)
- **NODE_ENV**: Environment mode (development/production)
- **REPL_ID**: Replit-specific deployment identifier

## User Preferences

Preferred communication style: Simple, everyday language.

## Changelog

Changelog:
- June 26, 2025. Initial setup