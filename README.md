# Medical Inventory Management System

A comprehensive web-based solution for managing medical inventory, tracking stock levels, and monitoring medicine expiry dates.

## Features

- **Dashboard Overview**

  - Real-time stock status monitoring
  - Low stock alerts
  - Expiry date tracking
  - Quick access to critical information

- **Stock Management**

  - Add new stock entries with detailed information
  - Track batch numbers and manufacturing dates
  - Monitor stock quantities
  - Set and track MRP (Maximum Retail Price)
  - Cost price management
  - Multiple stock entries per medicine

- **Medicine Management**

  - Add new medicines to inventory
  - Track medicine details including:
    - Name
    - Category
    - Description
    - Price
    - Stock quantity
    - Expiry dates
    - Batch numbers
    - Manufacturing dates
    - MRP

- **Advanced Filtering**
  - Filter by stock status (low stock, expiring)
  - Filter by stock dates
  - Combined filtering options

## Tech Stack

### Frontend

- React.js
- Next.js
- CSS Modules
- Modern UI/UX design

### Backend

- Node.js
- Express.js
- MongoDB
- RESTful API architecture

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- MongoDB
- npm or yarn

### Mongodb setup

1. Create a database with name : test

2. Create a collection with name: users

3. Create a user with following fields:
  a. username
  b. password
  c. isAdmin (true/false)

### Installation

1. Clone the repository:

```bash
git clone [repository-url]
cd med-app
```

2. Install frontend dependencies:

```bash
cd frontend
npm install
```

3. Install backend dependencies:

```bash
cd ../backend
npm install
```

4. Set up environment variables:

   - Create `.env` file backend directory
   - Configure necessary environment variables : MONGODB_URI, JWT_SECRET

5. Start the development servers:

Backend:

```bash
cd backend
npm start
```

Frontend:

```bash
cd frontend
npm run dev
```

## Usage

1. Access the application at `http://localhost:3000`
2. Navigate through the dashboard to view stock status
3. Use the stock management interface to add or update inventory
4. Monitor low stock and expiring items through the dashboard
5. Use filters to find specific medicines or stock entries

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For support, please open an issue in the repository or contact the development team.
