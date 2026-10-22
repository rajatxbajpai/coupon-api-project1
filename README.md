# Coupon API Project

A full-stack Coupon Management application built with React, TypeScript, Node.js, Express, and MongoDB. The application allows users to create discount coupons, view existing coupons, and calculate discounted prices.

## Features

- Create discount coupons
- View previously created coupons
- Set coupon expiry dates
- Apply coupons to an order amount
- Calculate discount and final price
- React-based user interface
- REST API built with Express
- MongoDB integration for persistent storage

## Tech Stack

- Frontend: React, TypeScript, Vite
- Backend: Node.js, Express
- Database: MongoDB Atlas
- Deployment: Vercel
- Version Control: Git and GitHub

## Live Application

**Frontend:** 
https://coupon-api-project1.vercel.app/



## API Endpoints

### 1. Get All Coupons

**Method:** GET

**Endpoint:**
```text
https://coupon-api-project1-rf79.vercel.app/coupons
```

Returns the list of existing coupons.

Example response:

```json
{
  "coupons": [
    {
      "code": "AVD2",
      "discountPercent": 10,
      "expiresAt": "2027-12-31T23:59:59.000Z",
      "createdAt": "2026-10-21T18:55:29.706Z"
    }
  ]
}
```

The example is illustrative; actual results depend on the data stored in your database.

### 2. Create a Coupon

**Method:** POST

**Endpoint:**
```text
https://coupon-api-project1-rf79.vercel.app/coupons
```

**Request body:**

```json
{
  "code": "SAVE10",
  "discountPercent": 10,
  "expiresAt": "2027-12-31T23:59:59.000Z"
}
```

Send the JSON body with the `Content-Type: application/json` header.

### 3. Apply a Coupon

**Method:** POST

**Endpoint:**
```text
https://coupon-api-project1-rf79.vercel.app/coupons/apply
```

Use the request fields required by your backend implementation, such as the coupon code and order amount.

## Run the Project Locally

### Prerequisites

Install the following:

- Node.js and npm
- Git
- Visual Studio Code
- A MongoDB Atlas account if using a remote database

### Start the Backend

1. Open the project in VS Code.
2. Open a terminal and navigate to the backend directory.
3. Install dependencies:

```bash
npm install
```

4. Configure the environment variables required by your backend, including the MongoDB connection URI.
5. Start the backend using the script defined in its `package.json`, for example:

```bash
npm start
```

Check the backend's `package.json` if that command is not available.

### Start the Frontend

Open a second terminal and navigate to the frontend directory:

```bash
cd frontend
npm install
npm run dev
```

Open the local URL printed by Vite in the terminal, usually:

```text
http://localhost:5173
```

Make sure the frontend's API URL points to the backend you want to use.

## Environment Variables

Store secrets in environment variables rather than hardcoding them in source code.

For example, your backend may use:

```text
MONGODB_URI=your_mongodb_connection_string
```

Use the exact variable name expected by your backend code. Do not commit `.env` files, database passwords, or API secrets to GitHub.

For deployment, configure the required variables in the backend project's Vercel settings and redeploy.

## GitHub Repository

https://github.com/rajatxbajpai/coupon-api-project1

## Future Improvements

- Improved error handling and validation
- Coupon usage limits
- Authentication and authorization
- Automated API tests
- Better coupon management and reporting

## Author

Developed as a full-stack development project to practise React, REST APIs, backend development, database integration, and deployment.
