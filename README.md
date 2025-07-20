# TSOAM Church Management System

## 🏛️ About The Seed of Abraham Ministry (TSOAM)

The Seed of Abraham Ministry (TSOAM) Church Management System is a comprehensive, modern web application designed specifically for church administration and management. Built with cutting-edge technologies, it provides a centralized platform for managing all aspects of church operations.

## ✨ Key Features

### 👥 Member Management

- **Dual membership system**: New members and full members
- **Automatic eligibility tracking**: 6-month minimum + requirements
- **Complete member profiles**: Personal, spiritual, and service information
- **Membership transfer workflow**: Seamless transition from new to full member
- **Service group management**: Track member participation

### 💰 Financial Management

- **Centralized financial hub**: All transactions flow through finance module
- **Real-time synchronization**: Automatic updates from all modules
- **Approval workflow**: Transactions >KSh 1,000 require approval
- **Comprehensive reporting**: Income, expenses, and financial summaries
- **Offering management**: Digital collection and banking tracking
- **Multi-currency support**: Primary currency KSH with others supported

### 👔 Human Resources

- **Employee management**: Complete HR records and documentation
- **Payroll processing**: PAYE, NSSF, NHIF calculations
- **Leave management**: Request, approval, and tracking system
- **Document management**: CV, contracts, certificates storage
- **Performance tracking**: Employee evaluation and development

### 🏥 Welfare System

- **Request management**: Comprehensive welfare application process
- **Eligibility verification**: Automatic membership and status checks
- **Approval workflow**: Committee-based decision making
- **Payment tracking**: Integration with financial system
- **Reporting**: Welfare distribution analytics

### 📦 Inventory Management

- **Asset tracking**: Complete equipment and property management
- **Maintenance scheduling**: Routine and repair tracking
- **Financial integration**: Purchase and maintenance cost tracking
- **Status monitoring**: Working, faulty, maintenance, disposal tracking
- **Supplier management**: Vendor information and history

### 📅 Events & Appointments

- **Event management**: Planning, scheduling, and tracking
- **Appointment system**: Pastoral and administrative scheduling
- **Priority management**: High, medium, low priority classification
- **Participant tracking**: Attendance and involvement monitoring
- **Budget management**: Event cost planning and tracking

### 💬 Communication System

- **Multi-channel messaging**: Email, SMS, in-app notifications
- **Group messaging**: Target specific groups or broadcast all
- **Template system**: Pre-defined message templates
- **Delivery tracking**: Message status and delivery confirmation
- **Automated notifications**: System-generated alerts and reminders

### 🔐 Security & Access Control

- **Role-based access control**: Admin, HR Officer, Finance Officer, User
- **JWT authentication**: Secure session management
- **Permission system**: Granular access control for each module
- **Account management**: User creation, activation, and deactivation
- **Audit logging**: Complete system activity tracking

## 🛠️ Technology Stack

### Frontend

- **React 18.2+** with TypeScript for type safety
- **Vite** for fast development and building
- **Tailwind CSS** for modern, responsive styling
- **Radix UI** for accessible, customizable components
- **TanStack Query** for efficient data fetching
- **React Router** for client-side routing
- **Recharts** for beautiful data visualizations

### Backend

- **Node.js 16+** with Express.js framework
- **MySQL 8.0+** with optimized schema design
- **JWT** for stateless authentication
- **Multer** for secure file uploads
- **bcryptjs** for password hashing
- **Nodemailer** for email functionality

### Development Tools

- **TypeScript** for enhanced developer experience
- **ESLint & Prettier** for code quality
- **Git** for version control
- **npm** for package management

## 🚀 Quick Start

### Prerequisites

- Node.js 16.0.0 or higher
- npm 8.0.0 or higher
- MySQL 8.0 or higher
- Git (recommended)

### Installation

1. **Clone or download the system**

   ```bash
   git clone https://github.com/tsoam/church-management-system.git
   cd church-management-system
   ```

2. **Run the automated setup**

   ```bash
   node setup-system.js
   ```

3. **Start the development server**

   ```bash
   npm run dev
   ```

4. **Access the system**
   - Open your browser to `http://localhost:3001`
   - Login with: `admin@tsoam.org` / `admin123`

### Manual Setup (Alternative)

If automated setup fails, follow these steps:

1. **Install dependencies**

   ```bash
   npm run install-all
   ```

2. **Setup environment**

   ```bash
   cp .env.example .env
   # Edit .env with your database credentials
   ```

3. **Create database**

   ```bash
   mysql -u root -p -e "CREATE DATABASE tsoam_church_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci"
   mysql -u root -p tsoam_church_db < database/schema.sql
   mysql -u root -p tsoam_church_db < database/optimize_database.sql
   ```

4. **Start the application**
   ```bash
   npm run dev
   ```

## 📋 User Roles & Permissions

### 🔑 Admin

**Full system access** - Complete control over all modules and settings

- All member and user management
- Complete financial oversight and approval
- System configuration and maintenance
- User account creation and management
- Access to all reports and analytics

### 👔 HR Officer

**Human resources and member management focus**

- Member management (full access)
- HR module (employee management, payroll)
- Appointments scheduling
- System logs monitoring
- Limited financial view (no approval rights)

### 💰 Finance Officer

**Financial operations and welfare management**

- Finance module (full access)
- Welfare management
- Events and budget management
- Transaction approval rights
- Financial reporting and analytics

### 👤 User

**Basic access for general church staff**

- Member information viewing
- Events participation
- Messaging system
- Settings (personal preferences)
- Limited reporting access

## 📊 System Architecture

### Database Design

The system uses a normalized MySQL database with:

- **Users & Authentication**: Secure user management
- **Members**: Dual system for new and full members
- **Financial**: Centralized transaction tracking
- **HR**: Complete employee lifecycle management
- **Welfare**: Request and approval workflow
- **Inventory**: Asset and maintenance tracking
- **Events**: Planning and execution management
- **Communication**: Multi-channel messaging system

### API Architecture

RESTful API design with:

- **Authentication**: JWT-based stateless authentication
- **Authorization**: Role-based access control
- **Validation**: Input sanitization and validation
- **Error Handling**: Consistent error responses
- **Logging**: Comprehensive audit trail

### Frontend Architecture

Modern React application with:

- **Component Library**: Reusable UI components
- **State Management**: Context API with hooks
- **Routing**: Protected routes with role checking
- **Forms**: Validated form handling
- **Charts**: Interactive data visualizations

## 🔧 Configuration

### Environment Variables

```env
# Database Configuration
DB_HOST=localhost
DB_PORT=3306
DB_NAME=tsoam_church_db
DB_USER=root
DB_PASSWORD=your_password

# Server Configuration
PORT=3001
NODE_ENV=development

# Security Configuration
JWT_SECRET=your_jwt_secret
SESSION_SECRET=your_session_secret
BCRYPT_ROUNDS=12

# Church Settings
CHURCH_NAME=The Seed of Abraham Ministry (TSOAM)
CHURCH_EMAIL=admin@tsoam.org
DEFAULT_CURRENCY=KSH
DEFAULT_TIMEZONE=Africa/Nairobi
```

### Scripts Available

```bash
# Development
npm run dev              # Start both client and server
npm run dev-client       # Start only client
npm run dev-server       # Start only server

# Production
npm run build           # Build for production
npm start              # Start production server

# Database
npm run create-db       # Create database
npm run import-schema   # Import database schema
npm run backup-db       # Backup database

# Utilities
npm run test-connection # Test database connection
npm run health-check    # Check system health
npm run cleanup         # Clean up system files
```

## 📁 Project Structure

```
tsoam-church-management-system/
├── client/                     # Frontend React application
│   ├── components/            # Reusable UI components
│   │   ├── auth/             # Authentication components
│   │   ├── layout/           # Layout components
│   │   └── ui/               # Base UI components (Radix UI)
│   ├── contexts/             # React contexts (Auth, Theme)
│   ├── hooks/                # Custom React hooks
│   ├── lib/                  # Utility libraries
│   ├── pages/                # Main application pages
│   ├── services/             # API service layer
│   ├── utils/                # Helper utilities
│   └── main.tsx              # Application entry point
│
├── server/                    # Backend Node.js application
│   ├── config/               # Configuration files
│   ├── routes/               # API route handlers
│   ├── uploads/              # File upload storage
│   ├── logs/                 # Server logs
│   └── server.js             # Server entry point
│
├── database/                  # Database files
│   ├── schema.sql            # Database schema
│   ├── optimize_database.sql # Performance optimizations
│   └── config.js             # Database configuration
│
├── docs/                      # Documentation
├── logs/                      # Application logs
├── backups/                   # Database backups
├── uploads/                   # File uploads
├── scripts/                   # Build and utility scripts
└── temp/                      # Temporary files
```

## 🔄 System Integration

### Financial Integration Flow

1. **Module generates transaction** (HR, Inventory, Welfare, Events)
2. **Financial service validates** and processes
3. **Approval workflow** activates if required (>KSh 1,000)
4. **Real-time updates** sent to all subscribers
5. **Dashboard reflects changes** immediately

### Member Lifecycle

1. **Visitor registration** as new member
2. **Requirements tracking** (baptism, bible study)
3. **Eligibility calculation** (automatic after 6 months + requirements)
4. **Transfer approval** to full membership
5. **Service group assignment** and activity tracking

## 📈 Reporting & Analytics

### Financial Reports

- Income vs Expense analysis
- Monthly financial summaries
- Category-wise spending breakdown
- Offering collection trends
- Budget vs actual comparisons

### Member Reports

- Membership growth trends
- Service group participation
- Attendance patterns
- New member conversion rates
- Demographic analysis

### HR Reports

- Payroll summaries
- Leave utilization
- Employee performance metrics
- Department-wise analytics
- Cost center reporting

### Welfare Reports

- Request patterns and trends
- Approval rates and reasons
- Distribution by demographics
- Financial impact analysis
- Outcome tracking

## 🔒 Security Features

### Data Protection

- **Password encryption** with bcrypt (12 rounds)
- **JWT tokens** with expiration and refresh
- **SQL injection prevention** with parameterized queries
- **XSS protection** with input sanitization
- **File upload restrictions** with type and size validation

### Access Control

- **Role-based permissions** with granular control
- **Session management** with timeout and extension
- **Account lifecycle** management with activation/deactivation
- **Audit logging** for all system activities
- **IP tracking** for security monitoring

### Database Security

- **Dedicated users** with minimal privileges
- **Connection pooling** with secure configurations
- **Regular backups** with encryption
- **Index optimization** for performance
- **Stored procedures** for complex operations

## 🚀 Deployment

### Development Deployment

1. Follow the Quick Start guide above
2. Use `npm run dev` for development mode
3. Access at `http://localhost:3001`

### Production Deployment

1. **Server setup** with Node.js and MySQL
2. **Environment configuration** with production values
3. **Build application** with `npm run build-production`
4. **Database optimization** with provided SQL scripts
5. **Process management** with PM2 or similar
6. **Reverse proxy** with Nginx for SSL and performance
7. **Monitoring setup** for health and performance

### Docker Deployment (Optional)

- Docker configurations available in separate branch
- Includes containerized database and application
- Environment-specific configurations
- Automated deployment pipelines

## 🆘 Support & Maintenance

### Documentation

- **INSTALLATION_GUIDE.md**: Complete setup instructions
- **SYSTEM_DOCUMENTATION.md**: Technical architecture details
- **PROJECT_STRUCTURE.md**: File organization overview
- **API Documentation**: Available in `/docs` folder

### Troubleshooting

- **Database issues**: Check connection and credentials
- **Permission errors**: Verify user roles and access
- **Performance issues**: Check database indexing and queries
- **File upload problems**: Verify directory permissions and limits

### Getting Help

- **Email Support**: support@tsoam.org
- **Documentation**: Check the `/docs` folder
- **Issue Tracking**: GitHub Issues (if using Git)
- **Community**: Join the TSOAM developer community

### Maintenance Schedule

- **Weekly**: Security updates and backup verification
- **Monthly**: Dependency updates and performance review
- **Quarterly**: Feature updates and system optimization
- **Annually**: Complete security audit and infrastructure review

## 🎯 Future Enhancements

### Planned Features

- **Mobile application** for iOS and Android
- **Advanced reporting** with custom report builder
- **Integration APIs** for third-party systems
- **Automated backups** to cloud storage
- **Multi-language support** for international use
- **Advanced analytics** with machine learning insights

### Contributing

- Follow the coding standards in the documentation
- Submit pull requests for review
- Report bugs through the issue tracking system
- Suggest enhancements through the proper channels

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **The Seed of Abraham Ministry** for the vision and requirements
- **TSOAM Development Team** for the implementation
- **Open Source Community** for the tools and libraries used
- **Beta testers** for feedback and validation

---

**Version**: 2.0.0  
**Release Date**: January 2024  
**Compatibility**: Node.js 16+, MySQL 8.0+, Modern Browsers  
**Support**: support@tsoam.org

For detailed technical documentation, see [SYSTEM_DOCUMENTATION.md](SYSTEM_DOCUMENTATION.md)  
For step-by-step installation, see [INSTALLATION_GUIDE.md](INSTALLATION_GUIDE.md)
