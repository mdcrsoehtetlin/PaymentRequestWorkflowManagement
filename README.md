# Payment Request Workflow Management

A full-stack web application designed for managing payment request workflows. It provides a robust backend API and a modern frontend interface with real-time updates.

## Tech Stack

### Backend
- **Framework**: [NestJS](https://nestjs.com/) (Node.js)
- **Database**: PostgreSQL with [TypeORM](https://typeorm.io/)
- **Authentication**: Passport.js (JWT & Local strategy)
- **Real-time Communication**: WebSockets (Socket.IO)
- **Language**: TypeScript

### Frontend
- **Framework**: [React](https://react.dev/) + [Vite](https://vitejs.dev/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **Routing**: React Router
- **Icons**: Lucide React
- **HTTP Client**: Axios
- **Real-time Client**: Socket.IO Client
- **Language**: TypeScript

---

## Project Structure

- `/src` - Backend source code (NestJS modules, controllers, services, etc.)
- `/frontend` - Frontend source code (React components, pages, hooks, etc.)
- `/docs` - Project documentation
- `/test` - Backend e2e tests

---

## Getting Started

### Prerequisites

Ensure you have the following installed:
- Node.js (v16 or higher recommended)
- PostgreSQL
- npm or yarn

### 1. Backend Setup

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Environment Variables**:
   Create a `.env` file in the root directory based on your database configuration and JWT secrets.
   Example:
   ```env
   DB_HOST=localhost
   DB_PORT=5432
   DB_USERNAME=your_db_user
   DB_PASSWORD=your_db_password
   DB_DATABASE=your_db_name
   JWT_SECRET=your_super_secret_key
   PORT=3000
   ```

3. **Run Migrations (if applicable)**:
   ```bash
   npm run migration:run
   ```

4. **Start the Development Server**:
   ```bash
   npm run start:dev
   ```
   The backend will be available at `http://localhost:3000`.

### 2. Frontend Setup

1. **Navigate to the frontend directory**:
   ```bash
   cd frontend
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Start the Vite Development Server**:
   ```bash
   npm run dev
   ```
   The frontend will be available at `http://localhost:5173`.

---

## Available Scripts

### Backend
- `npm run start:dev` - Starts the backend in development/watch mode.
- `npm run build` - Builds the backend for production.
- `npm run lint` - Lints the backend TypeScript code.
- `npm run test` - Runs backend unit tests.

### Frontend (inside `/frontend`)
- `npm run dev` - Starts the frontend development server.
- `npm run build` - Builds the frontend for production.
- `npm run lint` - Lints the frontend code.

---

## License

This project is UNLICENSED.
