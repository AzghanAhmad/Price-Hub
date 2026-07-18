# Price Hub: Ecommerce Platform

Price Hub is a comprehensive e-commerce platform built with React, TypeScript, and Supabase. It features a complete suite of features including user authentication, product catalog management, shopping cart, order history, and admin management.

## Features

- **Authentication**:
  - Secure user signup and login with email/password.
  - Session management and user data handling.

- **Product Catalog**:
  - Dynamic product display with images, prices, and ratings.
  - Detailed product pages with multiple images.
  - Responsive grid layout that adapts to screen size.

- **Shopping Cart**:
  - Add/remove products from the cart.
  - Quantity management.
  - Real-time cart updates.

- **Order Management**:
  - Order history for authenticated users.
  - Detailed order views with order items and total price.
  - Payment integration (simulated).

- **Admin Dashboard**:
  - Full CRUD operations for products.
  - Category management.
  - Image upload and management.
  - Order tracking and management.

- **User Experience**:
  - Responsive design for desktop and mobile.
  - Toast notifications for user actions.
  - Clean and modern UI with Tailwind CSS.

- **Backend**:
  - Supabase integration for database and authentication.
  - Database schema for products, categories, users, and orders.

## Tech Stack

- **Frontend**: React, TypeScript
- **Styling**: Tailwind CSS
- **State Management**: React Context API
- **Routing**: React Router
- **Backend**: Supabase

## Setup and Installation

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn

### Steps

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd price-hub
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   yarn install
   ```

3. **Configure Supabase**
   - Copy the `.env.example` file to `.env`
   - Add your Supabase credentials to `.env`:
     ```env
     VITE_SUPABASE_URL=https://your-project.supabase.co
     VITE_SUPABASE_ANON_KEY=your-anon-key
     ```

4. **Run the application**
   ```bash
   npm run dev
   # or
   yarn dev
   ```

## Available Commands

- `npm run dev`: Start the development server
- `npm run build`: Build the application for production
- `npm run lint`: Run ESLint to check for code issues
- `npm run preview`: Preview the production build
