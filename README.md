# UniFi Guest Portal

A self-hosted portal for managing guest WiFi access on UniFi networks with voucher redemption and payment integration.

## Features

- **Guest Portal Frontend**
  - Landing page with options to purchase access or redeem vouchers
  - Plan selection with different durations, speeds, and data limits
  - Payment processing through Stripe (extensible for other payment providers)
  - Voucher redemption interface
  - Device information and connection status
  - Mobile-responsive design for all device types

- **Admin Panel**
  - Dashboard with usage statistics and revenue metrics
  - Voucher management (create, view, revoke)
  - Payment history and transaction reports
  - Guest management with ability to disconnect users
  - Plan configuration (pricing, duration, bandwidth)
  - System settings for customizing the portal

- **Backend Integration**
  - UniFi Controller API integration for guest authorization
  - Stripe payment processing
  - Voucher generation and tracking
  - User session management
  - Analytics and reporting

- **Technical Stack**
  - Frontend: React with styled-components
  - Backend: Node.js with Express
  - Database: MongoDB for data storage
  - Payment: Modular payment system with Stripe integration
  - Authentication: JWT for admin access
  - Containerization: Docker and Docker Compose

## Prerequisites

- Docker and Docker Compose
- UniFi Controller (Cloud Key, Dream Machine, or self-hosted)
- Stripe account (optional, for payment processing)

## Installation

### Quick Start with Docker

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/unifi-guest-portal.git
   cd unifi-guest-portal
   ```

2. Create an environment file:
   ```bash
   cp .env.example .env
   ```

3. Edit the `.env` file with your configuration details:
   - Set a secure `JWT_SECRET`
   - Configure your UniFi Controller connection details
   - Add your Stripe API keys if you'll be using payment features

4. Start the application with Docker Compose:
   ```bash
   docker-compose up -d
   ```

5. Access the portal at:
   - http://localhost:3881 (direct Node.js access)
   - http://localhost:3883 (via Nginx HTTP)
   - https://localhost:3443 (via Nginx HTTPS)

### SSL Configuration (Optional)

For production use, you should configure SSL:

1. Place your SSL certificate and key in the `nginx/ssl` directory:
   ```bash
   mkdir -p nginx/ssl
   # Copy your certificate and key files to this directory
   cp your-cert.pem nginx/ssl/cert.pem
   cp your-key.pem nginx/ssl/key.pem
   ```

2. Adjust the Nginx configuration in `nginx/conf.d/default.conf` if needed.

### Initial Setup

The application includes a built-in setup wizard that will guide you through the initial configuration process:

1. When you first access the application, you'll be redirected to the setup wizard
2. Create an admin user with username, email, and password
3. Configure your UniFi Controller connection details
4. Set up payment integration (optional)
5. Choose whether to initialize with sample data

#### Database Configuration

This project uses a database-first approach to configuration. Instead of relying solely on environment variables, all settings are stored in the database:

- **UniFi Controller settings**: URL, port, credentials, and site ID
- **Payment provider settings**: API keys and configuration 
- **Portal settings**: Branding, terms of service, etc.

This approach has several advantages:
- Settings can be changed through the admin interface without restarting the application
- Sensitive information is stored in a single, secure location
- Default values can be provided in environment variables as fallbacks

The `.env` file is still used for initial database connection and basic server configuration, but application settings are managed through the admin interface and stored in the database.

#### Alternative Manual Setup

If you prefer to set up the system manually without using the setup wizard:

1. Configure your MongoDB connection in `.env` based on `.env.example`
2. Run the initialization script to create an admin user and sample data:
   ```bash
   node server/utils/initData.js
   ```
3. Access the admin panel at http://localhost:3881/admin/login
4. Log in with the default credentials (username: `admin`, password: `adminpassword`)
5. Update system settings as needed

## Usage

### Admin Panel

The admin panel is accessible at `/admin` and allows you to:

- View dashboard with usage statistics (`/admin/dashboard`)
- Manage guests (`/admin/guests`)
  - View all guests with filtering options
  - View individual guest details (`/admin/guests/:id`)
  - Authorize and unauthorize guests
- Generate and manage vouchers (`/admin/vouchers`)
  - Create new voucher batches
  - View and revoke existing vouchers
- View payment history (`/admin/payments`)
- Configure WiFi plans (`/admin/plans`)
- Adjust system settings (`/admin/settings`)

### Guest Portal

The guest portal is the default landing page and allows users to:

- View the landing page with network information (`/`)
- Purchase WiFi access (`/purchase`)
  - Select a plan (`/purchase`)
  - Process payment (`/payment/:planId`)
  - View success page after payment (`/success/payment`)
- Redeem vouchers (`/redeem`)
  - View success page after redemption (`/success/voucher`)
- View device information (`/device-info`)
- Check connection status and remaining time

## Extending the Payment System

The payment system is designed to be modular and extensible. To add a new payment provider:

1. Create a new provider class that implements the `PaymentProviderInterface`
2. Add the provider to the payment service factory
3. Create UI components for the new payment method
4. Update the configuration to include the new provider

For example, to add PayPal support:

1. Create `server/services/payments/providers/PayPalProvider.js`
2. Update `server/services/payments/index.js` to include the new provider
3. Create `src/components/payments/providers/PayPalPaymentForm.js`
4. Add PayPal configuration in `.env` and `server/config/payments.js`

## Development

### Running Locally (Without Docker)

1. Install dependencies:
   ```bash
   npm install
   ```

2. Configure environment variables:
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

3. Install and set up MongoDB locally:
   ```bash
   # For MacOS with Homebrew
   brew tap mongodb/brew
   brew install mongodb-community
   brew services start mongodb-community

   # For Ubuntu/Debian
   sudo apt update
   sudo apt install -y mongodb
   sudo systemctl start mongodb

   # For Windows
   # Download and install from https://www.mongodb.com/try/download/community
   ```

4. Start the development server for React frontend:
   ```bash
   # On Windows:
   npm start
   
   # On Mac/Linux:
   npm run start:unix
   ```

5. In a separate terminal, start the backend server:
   ```bash
   node server/index.js
   ```

6. For development with hot reloading on both frontend and backend:
   ```bash
   # Install nodemon if you don't have it
   npm install -g nodemon
   
   # Start the backend with nodemon
   nodemon server/index.js
   
   # In another terminal, start the frontend
   npm start
   ```

7. Access the application:
   - Frontend: http://localhost:3880 (development server)
   - Backend API: http://localhost:3881/api (production server)

### Testing

```bash
# Run all tests
npm test

# Run specific test suite
npm test -- --testPathPattern=auth

# Run tests with coverage report
npm test -- --coverage
```

### API Documentation

The API endpoints are organized into the following groups:

- Auth API: `/api/auth/*`
- Admin API: `/api/admin/*` 
- Guest API: `/api/guest/*`
- Payment API: `/api/payments/*`

For detailed API documentation, start the server and visit:
- http://localhost:3881/api-docs (when Swagger UI is integrated)

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- UniFi API for providing the ability to manage guest access
- Stripe for payment processing capabilities
- All contributors to this project
