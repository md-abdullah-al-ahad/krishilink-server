# KrishiLink Server

A REST API server for connecting farmers with buyers through a crop marketplace platform. Built with Express.js and MongoDB.

## Features

### User Management

- Create and authenticate users
- Retrieve user profiles by email
- Update user information (name, profile photo)

### Crop Listings

- List all available crops
- Search crops by name, type, or location
- Get latest 6 crop listings
- View individual crop details
- Create new crop listings with owner information
- Update existing crop listings
- Delete crop listings
- Filter crops by owner email

### Interest System

- Buyers can express interest in crops
- Track quantity requested and messages
- Manage interest status (pending, accepted, rejected)
- View all interests for a specific crop
- Get buyer's interest history
- Sort interests by status
- Auto-decrement crop quantity on acceptance

## Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js v4.18.2
- **Database**: MongoDB with MongoDB Node.js Driver v6.20.0
- **CORS**: Enabled for cross-origin requests
- **Environment**: dotenv for configuration management

## Prerequisites

- Node.js (v14 or higher)
- MongoDB Atlas account or local MongoDB instance
- npm or yarn package manager

## Installation

1. Clone the repository:

```bash
git clone https://github.com/md-abdullah-al-ahad/krishilink-server.git
cd krishilink-server
```

2. Install dependencies:

```bash
npm install
```

3. Create a `.env` file in the root directory:

```env
DB_USER=your_mongodb_username
DB_PASS=your_mongodb_password
DB_NAME=your_database_name
PORT=5000
NODE_ENV=development
```

4. Start the server:

```bash
# Development mode with auto-reload
npm run dev

# Production mode
npm start
```

## API Endpoints

### Health Check

- `GET /` - Server status
- `GET /health` - Database connection status

### Users

- `POST /users` - Create new user or return existing
- `GET /users/:email` - Get user by email
- `PUT /users/:email` - Update user profile

### Crops

- `GET /crops` - Get all crops
- `GET /crops/search?q={query}` - Search crops
- `GET /crops/latest` - Get 6 most recent crops
- `GET /crops/:id` - Get crop by ID
- `GET /crops/:id/interests` - Get interests for a crop
- `POST /crops` - Create new crop listing
- `GET /my-crops/:email` - Get crops by owner email
- `PUT /crops/:id` - Update crop listing
- `DELETE /crops/:id` - Delete crop listing

### Interests

- `POST /interests` - Express interest in a crop
- `GET /my-interests/:email` - Get user's interests
- `GET /my-interests/:email/sorted?sortBy=status` - Get sorted interests
- `PUT /interests/update` - Update interest status

## Data Models

### User

```javascript
{
  name: String,
  email: String,
  photoURL: String,
  createdAt: String (ISO 8601)
}
```

### Crop

```javascript
{
  name: String,
  type: String,
  pricePerUnit: Number,
  unit: String,
  quantity: Number,
  description: String,
  location: String,
  image: String,
  owner: {
    ownerName: String,
    ownerEmail: String
  },
  interests: Array
}
```

### Interest

```javascript
{
  _id: ObjectId,
  cropId: String,
  userEmail: String,
  userName: String,
  quantity: Number,
  message: String,
  status: String // "pending", "accepted", "rejected"
}
```

## Deployment

Configured for Vercel deployment with `vercel.json`. The server exports the Express app for serverless function compatibility.

## Development

```bash
# Install dependencies
npm install

# Run in development mode with nodemon
npm run dev
```

## License

ISC
