# TSOAM Church Management System - Project Structure

Generated on: 2024-01-15T12:00:00.000Z

## 📁 Main Directories

```
tsoam-church-management-system/
├── client/                 # Frontend React application
│   ├── components/        # Reusable UI components
│   │   ├── auth/         # Authentication components (ProtectedRoute)
│   │   ├── layout/       # Layout components (Layout, Header, Sidebar)
│   │   └── ui/           # Base UI components (Radix UI components)
│   ├── contexts/          # React contexts (AuthContext)
│   ├── hooks/             # Custom React hooks
│   ├── lib/               # Utility libraries
│   ├── pages/             # Main application pages (20+ pages)
│   ├── services/          # API service layer (4 services)
│   └── utils/             # Helper utilities
│
├── server/                # Backend Node.js application
│   ├── config/            # Configuration files (database.js)
│   ├── routes/            # API route handlers (12 route files)
│   ├── uploads/           # File upload storage
│   └── logs/              # Server logs
│
├── database/              # Database files
│   ├── schema.sql         # Database schema (20+ tables)
│   ├── optimize_database.sql  # Performance optimizations
│   └── config.js          # Database configuration
│
├── docs/                  # Documentation
├── logs/                  # Application logs
├── backups/               # Database backups
├── uploads/               # File uploads
│   ├── documents/         # General documents
│   ├── employee-docs/     # HR documents
│   ├── welfare/           # Welfare-related files
│   └── inventory/         # Inventory photos/docs
├── scripts/               # Build and utility scripts
└── temp/                  # Temporary files
```

## 🔧 Configuration Files

### Core Configuration

- `.env` - Environment configuration (production ready)
- `.env.production` - Production environment template
- `package.json` - Root dependencies and scripts (v2.0.0)
- `client/package.json` - Frontend dependencies
- `server/package.json` - Backend dependencies

### Build Configuration

- `tsconfig.json` - TypeScript configuration
- `tailwind.config.ts` - Tailwind CSS configuration
- `vite.config.ts` - Vite build configuration
- `postcss.config.js` - PostCSS configuration
- `components.json` - UI components configuration

### Development Configuration

- `.gitignore` - Git ignore patterns
- `.npmrc` - NPM configuration
- `.prettierrc` - Code formatting rules
- `.env.example` - Environment template

## 📚 Documentation Files

### Primary Documentation

- `README.md` - Complete project overview and quick start guide
- `INSTALLATION_GUIDE.md` - Detailed installation instructions
- `SYSTEM_DOCUMENTATION.md` - Technical architecture documentation
- `PROJECT_STRUCTURE.md` - This file - project organization
- `ENHANCED_FEATURES.md` - Feature documentation and specifications

### Setup & Utility Scripts

- `setup-system.js` - Comprehensive system setup script
- `cleanup-system.js` - System cleanup and optimization
- `start-tsoam.sh` - Linux/macOS startup script
- `start-tsoam.bat` - Windows startup script

## 🎯 Frontend Application Structure

### Pages (20+ React Pages)

```
client/pages/
├── Dashboard.tsx          # Main dashboard (role-based)
├── DashboardNew.tsx       # Enhanced dashboard
├── Login.tsx              # Authentication page
├── MemberManagement.tsx   # Full member management
├── NewMembers.tsx         # New member processing
├── HR.tsx                 # Human resources module
├── Finance.tsx            # Financial management
├── FinanceAdvanced.tsx    # Advanced finance features
├── Welfare.tsx            # Welfare request management
├── WelfareEnhanced.tsx    # Enhanced welfare features
├── Inventory.tsx          # Asset management
├── Events.tsx             # Event planning and management
├── Appointments.tsx       # Appointment scheduling
├── Messaging.tsx          # Communication system
├── Settings.tsx           # System settings
├── Users.tsx              # User management
├── SystemLogs.tsx         # Audit logs
├── SystemStatus.tsx       # System health monitoring
├── Profile.tsx            # User profile management
├── Index.tsx              # Landing page
└── NotFound.tsx           # 404 error page
```

### Components (50+ React Components)

```
client/components/
├── auth/
│   └── ProtectedRoute.tsx # Route protection
├── layout/
│   ├── Layout.tsx         # Main layout wrapper
│   ├── Header.tsx         # Navigation header
│   └── Sidebar.tsx        # Navigation sidebar
├── ui/                    # Radix UI components (40+ components)
│   ├── button.tsx
│   ├── card.tsx
│   ├── dialog.tsx
│   ├── table.tsx
│   └── ... (complete UI library)
├── AccountVerification.tsx # User account verification
├── BackupRecovery.tsx     # System backup management
├── EventCountdown.tsx     # Event countdown widget
├── EventsCalendar.tsx     # Calendar component
├── FinanceApprovalCenter.tsx # Transaction approval workflow
└── RecentActivities.tsx   # Activity feed component
```

### Services (API Integration Layer)

```
client/services/
├── FinancialTransactionService.ts # Central financial service
├── DashboardDataService.ts        # Dashboard data aggregation
├── BackupService.ts               # Backup and recovery
└── SettingsService.ts             # System settings management
```

## 🔙 Backend Application Structure

### API Routes (12 Route Handlers)

```
server/routes/
├── auth.js           # Authentication & user management
├── members.js        # Member CRUD operations
├── hr.js             # HR and employee management
├── finance.js        # Financial transactions
├── welfare.js        # Welfare request processing
├── inventory.js      # Asset management
├── events.js         # Event management
├── appointments.js   # Appointment scheduling
├── documents.js      # File upload and management
├── dashboard.js      # Dashboard data aggregation
├── system-logs.js    # Audit logging
└── demo.ts           # Demo/testing endpoints
```

### Configuration & Database

```
server/config/
└── database.js       # MySQL connection and configuration

database/
├── schema.sql        # Complete database schema (20+ tables)
├── optimize_database.sql # Performance optimizations
├── config.js         # Database configuration
└── init.sql          # Initial data and setup
```

## 📊 Database Schema Overview

### Core Tables (20+ Tables)

- **Authentication**: `users`, `user_requests`
- **Members**: `members`, `new_members`
- **HR**: `employees`, `payroll`, `leave_requests`, `employee_documents`
- **Finance**: `transactions`, `expenses`, `investments`
- **Welfare**: `welfare_requests`
- **Inventory**: `inventory_items`, `maintenance_records`
- **Events**: `events`, `appointments`
- **Communication**: `messages`
- **System**: `system_logs`, `document_uploads`, `settings`

### Database Features

- **Optimized indexes** for performance
- **Stored procedures** for complex operations
- **Triggers** for data integrity
- **Views** for common queries
- **Security roles** with minimal privileges

## 🔐 Security Implementation

### Authentication & Authorization

- **JWT-based authentication** with secure tokens
- **Role-based access control** (4 roles: Admin, HR Officer, Finance Officer, User)
- **Protected routes** with permission checking
- **Session management** with timeout and extension
- **Password security** with bcrypt hashing (12 rounds)

### Data Protection

- **SQL injection prevention** with parameterized queries
- **XSS protection** with input sanitization
- **File upload security** with type and size restrictions
- **CORS configuration** for frontend/backend communication
- **Environment variable protection** for sensitive data

## 🎨 UI/UX Architecture

### Design System

- **Tailwind CSS** for utility-first styling
- **Radix UI** for accessible, customizable components
- **Professional color scheme** with blue/gray theme
- **Responsive design** for mobile, tablet, and desktop
- **Consistent typography** with Inter font family

### User Experience

- **Role-based navigation** showing relevant modules only
- **Real-time updates** with automatic data refresh
- **Progressive enhancement** with loading states
- **Error handling** with user-friendly messages
- **Accessibility** with ARIA labels and keyboard navigation

## 🔄 Integration Architecture

### Financial Integration System

```
Modules → Financial Service → Approval Workflow → Real-time Updates
   ↓           ↓                    ↓                  ↓
  HR    →  Transaction   →     Pending Queue   →   Dashboard
Inventory →  Validation  →     Approval/Reject →   Notifications
Welfare   →  Processing  →     Status Update   →   Reports
Events    →  Storage     →     Audit Trail     →   Analytics
```

### Data Flow Patterns

- **Central service pattern** for financial transactions
- **Observer pattern** for real-time updates
- **Repository pattern** for data access
- **Service layer pattern** for business logic
- **Context pattern** for state management

## 📈 Performance Optimizations

### Database Optimizations

- **Indexed columns** for fast queries
- **Query optimization** with EXPLAIN analysis
- **Connection pooling** for efficient resource use
- **Stored procedures** for complex operations
- **Regular maintenance** with optimization scripts

### Frontend Optimizations

- **Code splitting** with React.lazy
- **Image optimization** with proper formats
- **Bundle analysis** and size monitoring
- **Caching strategies** for API responses
- **Virtual scrolling** for large datasets

### Backend Optimizations

- **Express.js middleware** for request processing
- **Compression** for response optimization
- **Rate limiting** for API protection
- **Error handling** with proper status codes
- **Logging** for performance monitoring

## 🛠️ Development Workflow

### Code Organization

- **TypeScript** for type safety throughout
- **Component-based architecture** with reusable components
- **Service-oriented architecture** for business logic
- **Modular design** with clear separation of concerns
- **Consistent naming conventions** across all files

### Quality Assurance

- **ESLint** for code quality enforcement
- **Prettier** for consistent formatting
- **TypeScript** for compile-time error checking
- **Component testing** structure ready
- **API testing** endpoints available

## 📦 Deployment Architecture

### Development Environment

- **Hot reload** with Vite for fast development
- **Concurrent execution** of client and server
- **Environment variables** for configuration
- **Local database** with MySQL
- **File watching** for automatic restarts

### Production Environment

- **Optimized builds** with tree shaking
- **Static asset serving** with Express
- **Process management** ready for PM2
- **Reverse proxy** configuration for Nginx
- **SSL/TLS** configuration templates

## 🔧 Maintenance & Monitoring

### Logging System

- **Application logs** in `/logs` directory
- **Error logging** with stack traces
- **Access logs** for request monitoring
- **Audit logs** for security tracking
- **Performance logs** for optimization

### Backup Strategy

- **Automated database backups** with npm scripts
- **File backup** for uploads and documents
- **Configuration backup** for environment files
- **Recovery procedures** documented
- **Backup verification** scripts included

## 🎯 Future Scalability

### Extensibility Points

- **Plugin architecture** for new modules
- **API versioning** for backward compatibility
- **Microservices ready** architecture
- **Multi-tenant** preparation
- **International** localization ready

### Technology Upgrade Path

- **React 18** features ready for adoption
- **Node.js LTS** compatibility maintained
- **MySQL 8** advanced features utilized
- **Modern JavaScript** features throughout
- **Progressive Web App** ready structure

---

## 📊 Key Statistics

- **Total Files**: 200+ files across the project
- **Code Lines**: 50,000+ lines of code
- **Components**: 50+ React components
- **Pages**: 20+ application pages
- **API Endpoints**: 100+ REST endpoints
- **Database Tables**: 20+ optimized tables
- **User Roles**: 4 distinct role types
- **Modules**: 8 main functional modules

## 🎉 Completion Status

✅ **Complete and Production Ready**

- All core functionality implemented
- Security measures in place
- Performance optimizations applied
- Documentation comprehensive
- Error handling robust
- Testing structure prepared

---

**Generated by TSOAM System v2.0.0**  
**Last Updated**: January 2024  
**Status**: Production Ready  
**Support**: support@tsoam.org
