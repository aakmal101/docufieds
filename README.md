# Docufieds - Visa Document Processing Portal

A comprehensive visa document processing service portal supporting two distinct client types: Individual customers and Travel Agencies, each with tailored workflows and features.

## Features

### Individual Clients
- **Payment Model**: Prepaid (pay before service)
- **Verification**: Mandatory profile completion with live verification
- **Service Access**: Full self-service portal with guided workflow
- **3D Interactive World Map**: For destination selection
- **Real-time Status Tracking**: Monitor application progress
- **Document Upload System**: Dynamic requirements based on destination

### Travel Agency Clients
- **Payment Model**: Postpaid (15-day payment cycle)
- **Document Limit**: Locked after 10 documents until payment
- **Service Access**: Bulk processing capabilities
- **Agency Dashboard**: Overview of all pending/processed applications
- **Credit Management**: Track outstanding amounts and limits

### Admin Panels
- **Support Team**: Handle customer callbacks and document configuration
- **Legal Team**: Document review and processing decisions
- **Accounts Team**: Financial management and invoice generation
- **Cash Officer**: Manual payment entry and verification

## Tech Stack

- **Frontend**: Next.js 14, React, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes, Prisma ORM
- **Database**: SQLite (development), PostgreSQL (production)
- **Authentication**: NextAuth.js with OTP verification
- **3D Graphics**: React Three Fiber, Three.js
- **UI Components**: Radix UI, Lucide React Icons
- **State Management**: Zustand, React Query

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Git

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd docufieds-portal
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp env.example .env.local
   ```
   
   Update the `.env.local` file with your configuration:
   ```env
   # Database
   DATABASE_URL="file:./dev.db"
   
   # NextAuth
   NEXTAUTH_URL="http://localhost:3000"
   NEXTAUTH_SECRET="your-secret-key-here"
   
   # SMS Gateway
   SMS_API_KEY="your-sms-api-key"
   SMS_API_URL="https://api.sms-gateway.com"
   
   # Email Service
   EMAIL_FROM="noreply@docufieds.com"
   EMAIL_SERVER_HOST="smtp.gmail.com"
   EMAIL_SERVER_PORT=587
   EMAIL_SERVER_USER="your-email@gmail.com"
   EMAIL_SERVER_PASSWORD="your-app-password"
   
   # Payment Gateway
   PAYMENT_GATEWAY_API_KEY="your-payment-gateway-key"
   PAYMENT_GATEWAY_SECRET="your-payment-gateway-secret"
   
   # MFS Integration
   MFS_API_KEY="your-mfs-api-key"
   MFS_API_URL="https://api.mfs-provider.com"
   ```

4. **Set up the database**
   ```bash
   npx prisma generate
   npx prisma db push
   ```

5. **Start the development server**
   ```bash
   npm run dev
   ```

6. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## Project Structure

```
src/
├── app/                    # Next.js 14 App Router
│   ├── api/               # API routes
│   ├── auth/              # Authentication pages
│   ├── dashboard/         # User dashboards
│   └── admin/             # Admin panels
├── components/            # React components
│   ├── ui/               # Reusable UI components
│   └── world-map.tsx     # 3D world map component
├── lib/                  # Utility libraries
│   ├── auth.ts          # NextAuth configuration
│   ├── prisma.ts        # Database client
│   ├── otp.ts           # OTP management
│   └── utils.ts         # Helper functions
├── types/               # TypeScript type definitions
└── prisma/             # Database schema
    └── schema.prisma   # Prisma schema file
```

## Key Features Implementation

### 1. Authentication System
- Multi-method login (phone, email, user ID)
- OTP verification via SMS/Email
- Role-based access control
- Session management

### 2. 3D World Map
- Interactive 3D globe using React Three Fiber
- Country selection with visual feedback
- Continent-based filtering
- Responsive design

### 3. Document Management
- Dynamic document requirements
- File upload with validation
- Progress tracking
- Status updates

### 4. Payment Integration
- Multiple payment methods (Online, MFS, Cash)
- Payment status tracking
- Invoice generation
- Refund management

### 5. Admin Panels
- Role-based access control
- Workflow management
- Real-time notifications
- Reporting and analytics

## Database Schema

The application uses Prisma ORM with the following main entities:

- **User**: Individual and agency accounts
- **Application**: Visa applications
- **Document**: Uploaded documents
- **Payment**: Payment transactions
- **StatusUpdate**: Application status history
- **Notification**: User notifications
- **OTP**: Verification codes
- **Country**: Supported countries
- **DocumentRequirement**: Country-specific requirements

## API Endpoints

### Authentication
- `POST /api/auth/send-otp` - Send OTP for verification
- `POST /api/auth/register` - User registration
- `POST /api/auth/verify-registration` - Verify registration OTP

### User Management
- `GET /api/user/profile` - Get user profile
- `PUT /api/user/profile` - Update user profile

### Applications
- `GET /api/applications` - Get user applications
- `POST /api/applications` - Create new application
- `PUT /api/applications/[id]` - Update application
- `DELETE /api/applications/[id]` - Delete application

### Documents
- `POST /api/documents/upload` - Upload document
- `GET /api/documents/[id]` - Get document details
- `DELETE /api/documents/[id]` - Delete document

### Payments
- `POST /api/payments/create` - Create payment
- `GET /api/payments/[id]` - Get payment details
- `POST /api/payments/verify` - Verify payment

## Deployment

### Production Setup

1. **Database**: Use PostgreSQL for production
2. **Environment Variables**: Set all required environment variables
3. **File Storage**: Configure cloud storage for document uploads
4. **SMS/Email Services**: Set up production SMS and email services
5. **Payment Gateway**: Configure production payment gateway
6. **SSL Certificate**: Ensure HTTPS is enabled

### Build and Deploy

```bash
# Build the application
npm run build

# Start production server
npm start
```

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For support, email support@docufieds.com or join our Slack channel.

## Roadmap

- [ ] Mobile app development
- [ ] Advanced analytics dashboard
- [ ] AI-powered document verification
- [ ] Multi-language support
- [ ] Integration with more payment gateways
- [ ] Automated status notifications
- [ ] Document template system
- [ ] Bulk application processing for agencies














