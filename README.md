# Onovi - התור שלך, בזמן שלך

![Onovi Logo](./client/public/assets/onovi-logo.png)

**Onovi** is a modern appointment booking platform that connects customers with local businesses. Find available time slots, book appointments instantly, and manage your schedule - all in one place.

## 🌟 Features

### For Customers
- 🗺️ **Location-Based Search** - Find businesses near you using GPS or address search
- 📅 **Real-Time Availability** - See available time slots instantly
- ⚡ **Quick Booking** - Book appointments in seconds
- 📱 **Mobile-Friendly** - Fully responsive design for all devices
- 🔒 **Secure** - Your data is protected with industry-standard security

### For Businesses
- 📊 **Dashboard** - Manage bookings, services, and availability
- 🎯 **Service Management** - Define services, pricing, and durations
- 📆 **Slot Management** - Create and manage available time slots
- 📈 **CRM System** - Track leads, manage contacts, and follow-ups
- ✅ **Verification** - Business verification using official Israeli identifiers
- 📍 **Location Management** - Precise address and coordinate management

### For Admins
- 🔐 **Business Approval** - Review and approve business registrations
- 📊 **Platform Management** - Monitor bookings, users, and businesses
- 📂 **Category Management** - Organize businesses by category

## 🏗️ Architecture

### Tech Stack

**Frontend:**
- React 18+ with Vite
- Leaflet & React-Leaflet for maps
- Modern CSS with design system variables
- RTL (Right-to-Left) support for Hebrew

**Backend:**
- Node.js with Express
- Prisma ORM with PostgreSQL
- JWT authentication
- bcrypt for password hashing

**Database:**
- PostgreSQL (production)
- Prisma schema with comprehensive models

### Project Structure

```
fillApp/
├── client/                 # Frontend React application
│   ├── public/            # Static assets
│   │   └── assets/        # Images and logo
│   ├── src/
│   │   ├── api.js         # API client and auth
│   │   ├── components/    # React components
│   │   ├── pages/         # Page components
│   │   ├── services/      # Business logic services
│   │   └── styles.css     # Global styles and design system
│   └── package.json
├── server/                # Backend API
│   ├── prisma/
│   │   ├── schema.prisma  # Database schema
│   │   └── seed.js        # Seed data
│   ├── src/
│   │   ├── routes/        # API routes
│   │   └── middleware/    # Express middleware
│   ├── data/              # Israeli address data
│   └── package.json
└── docs/                  # Documentation
    ├── architecture/      # Architecture docs
    ├── development/       # Development guides
    ├── testing/          # Test documentation
    ├── crm/              # CRM system docs
    └── deployment/       # Deployment guides
```

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ and npm
- PostgreSQL 14+
- Git

### Local Development Setup

1. **Clone the repository:**
```bash
git clone <repository-url>
cd fillApp
```

2. **Set up the database:**
```bash
# Install PostgreSQL if not already installed
# Create a new database
createdb onovi_dev
```

3. **Configure environment variables:**
```bash
# Server environment
cd server
cp .env.example .env
# Edit .env with your database credentials
```

4. **Install dependencies and setup database:**
```bash
# Install server dependencies
cd server
npm install

# Run database migrations
npx prisma migrate dev

# Seed the database (optional)
npm run seed

# Install client dependencies
cd ../client
npm install
```

5. **Start development servers:**

```bash
# Terminal 1 - Start backend (from server/)
npm run dev

# Terminal 2 - Start frontend (from client/)
npm run dev
```

6. **Access the application:**
- Frontend: http://localhost:5173
- Backend API: http://localhost:3000

## 📝 Environment Variables

### Server (.env)

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/onovi_dev"

# Server
PORT=3000
NODE_ENV=development

# Authentication
JWT_SECRET="your-secure-secret-key-change-in-production"

# Optional: External APIs
NOMINATIM_USER_AGENT="Onovi-Israel-Address-App/1.0"
```

See `server/.env.example` for complete configuration.

### Client

The client uses Vite and doesn't require environment variables for local development. API endpoint is configured in `src/api.js`.

## 🧪 Testing

```bash
# Run server tests
cd server
npm run test:flow

# Test address functionality
node test-addresses.js

# Test CRM API
node test-crm-api.js
```

See `/docs/testing/` for comprehensive test documentation.

## 📦 Building for Production

```bash
# Build client
cd client
npm run build
# Output: client/dist/

# Server runs directly from source
cd server
npm start
```

## 🚢 Deployment

Onovi is configured for deployment on Render.com with PostgreSQL database.

See `/docs/deployment/` for detailed deployment instructions.

### Quick Deploy Checklist

1. ✅ Set up PostgreSQL database on Render
2. ✅ Configure environment variables
3. ✅ Deploy backend service
4. ✅ Deploy frontend static site
5. ✅ Run database migrations
6. ✅ Verify deployment

## 🎨 Design System

Onovi uses a clean, modern design system with:

**Colors:**
- Primary: Mint/Teal gradient (#14b8a6)
- Accent: Deep Navy (#243b53)
- Background: Clean white

**Style:**
- Rounded corners (0.5rem - 2rem)
- Soft shadows
- Premium, trustworthy feel
- Fully responsive
- RTL support for Hebrew

See `client/src/styles.css` for the complete design system.

## 📚 Documentation

- **Architecture:** `/docs/architecture/`
- **Development Guides:** `/docs/development/`
- **Testing:** `/docs/testing/`
- **CRM System:** `/docs/crm/`
- **Deployment:** `/docs/deployment/`

## 🔐 Security

- JWT-based authentication
- Password hashing with bcrypt
- Role-based access control (Customer, Business, Admin)
- Business verification with official Israeli identifiers
- Secure environment variable management

## 🗺️ Roadmap

- [ ] SMS notifications
- [ ] Email notifications
- [ ] Payment integration
- [ ] Business analytics dashboard
- [ ] Customer review system
- [ ] Multi-language support (English)

## 📄 License

Proprietary - All rights reserved

## 🤝 Contributing

This is a private project. For questions or issues, please contact the development team.

## 📞 Support

For support and inquiries, please contact:
- Email: support@onovi.com
- Website: https://onovi.com

---

**Built with ❤️ in Israel**
