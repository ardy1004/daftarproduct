# MarketPlace Pro - E-Commerce Product Listing Platform

## Overview

MarketPlace Pro is a modern e-commerce product listing platform designed to showcase products with advanced filtering, search capabilities, and affiliate link integration. The application serves as a product discovery platform where users can browse, search, and filter products across various categories, with built-in analytics tracking for product interactions. It features a futuristic design with emerald, metallic blue, violet, and yellow color schemes, optimized for both desktop and mobile experiences.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript using Vite as the build tool
- **UI Library**: Radix UI components with shadcn/ui design system
- **Styling**: Tailwind CSS with custom CSS variables for theming
- **State Management**: TanStack Query (React Query) for server state management
- **Routing**: Wouter for lightweight client-side routing
- **Theme System**: Custom theme provider with light/dark mode support

### Backend Architecture
- **Runtime**: Node.js with Express.js REST API
- **Database ORM**: Drizzle ORM with PostgreSQL as the database
- **API Design**: RESTful endpoints for products, analytics, and settings
- **Development Server**: Vite development server integrated with Express for full-stack development

### Database Schema Design
- **Products Table**: Core product information including pricing, categories, ratings, and affiliate URLs
- **Product Analytics Table**: Event tracking for user interactions (clicks, views, purchases)
- **Settings Table**: Application configuration and feature toggles
- **Users Table**: Admin authentication and user management

### Key Features Implementation
- **Product Discovery**: Search functionality with keyword matching and advanced filtering
- **Category System**: Hierarchical category and subcategory organization
- **Featured Products**: Admin-configurable product carousel with manual ordering
- **Analytics Tracking**: Product interaction monitoring for popularity metrics
- **Affiliate Integration**: External product links with click tracking
- **Responsive Design**: Mobile-first approach with adaptive layouts

### Authentication & Authorization
- **Admin Panel**: Supabase authentication for administrative access
- **Session Management**: PostgreSQL session storage with connect-pg-simple
- **Role-based Access**: Admin-only routes for product management and analytics

## External Dependencies

### Database & Backend Services
- **Neon Database**: PostgreSQL hosting with connection pooling via @neondatabase/serverless
- **Supabase**: Authentication service and additional database features
- **Drizzle Kit**: Database migrations and schema management

### Frontend UI & Interactions
- **Radix UI**: Comprehensive set of accessible UI primitives for complex components
- **Lucide React**: Icon library for consistent iconography throughout the application
- **React Hook Form**: Form handling with validation via @hookform/resolvers and Zod
- **React Day Picker**: Date selection components for filtering and admin features
- **Embla Carousel**: Carousel functionality for featured products section

### Development & Build Tools
- **Vite**: Fast development server and build tool with React plugin
- **TypeScript**: Static type checking with strict configuration
- **ESBuild**: Fast JavaScript bundler for production builds
- **PostCSS & Autoprefixer**: CSS processing and vendor prefixing

### Styling & Design System
- **Tailwind CSS**: Utility-first CSS framework with custom color palette
- **Class Variance Authority**: Component variant management for consistent styling
- **Tailwind Merge & clsx**: Utility functions for conditional class composition

### Data Management
- **TanStack Query**: Server state management with caching and synchronization
- **Zod**: Runtime type validation and schema validation
- **Date-fns**: Date manipulation and formatting utilities