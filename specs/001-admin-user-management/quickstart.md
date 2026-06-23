# Quickstart Validation Guide: User Management & Auditing

This guide outlines the verification commands and validation steps to prove the admin user management and auditing features work end-to-end.

## 1. Prerequisites
- PostgreSQL instance running (port 5432) with databases seeded.
- Redis instance running (port 6379) for session management.
- NestJS backend running on port 3000 (`npm run start:dev`).
- React frontend running on port 5173 (`npm run dev`).

---

## 2. Automated Test Execution

### 2.1 Run Unit and Integration Tests
Validate standard functionality and error boundary cases.
```bash
# Run NestJS admin module tests
npm run test -- --testPathPattern=admin
```

### 2.2 Run End-to-End Tests
```bash
# Run all NestJS E2E API tests
npm run test:e2e -- --testPathPattern=admin
```

---

## 3. Manual E2E Validation Flow (Happy Path)

### 3.1 Step 1: Login as Admin
- Open Chrome DevTools.
- Log in to the application as a user with the `ADMIN` role.
- Verify that a JWT token is saved in localStorage and access is granted to `/admin/users`.

### 3.2 Step 2: Register a New User
- On the `/admin/users` dashboard, click the "+ Register New User" button.
- Fill out the modal fields (set name, email, employee number, dropdown branch, and role). Click "Save".
- **Verification**:
  - The UI must display a popup showing the generated secure, random temporary password.
  - The users grid must reload and display the new user account in "Active" status.
  - Settle that the database row matches the payload in the `users` table.

### 3.3 Step 3: Deactivate the User
- On the `/admin/users` grid row for the newly created user, toggle the Account Status toggle to "Disabled" and confirm.
- **Verification**:
  - Open a separate private browser window, attempt to log in using the temporary password, and verify it returns HTTP `401 Unauthorized` / "Account is inactive".
  - If the user was already logged in elsewhere, verify they are forced to log out immediately due to session eviction in Redis.

### 3.4 Step 4: Reset User Password
- Open the "Edit Details" modal for the deactivated user.
- Click the "Reset Password" button.
- **Verification**:
  - A new random temporary password must be displayed.
  - Settle that database `password_hash` has changed and is hashed using BCrypt.

### 3.5 Step 5: Verify Master Configurations & Logs
- Navigate to `/admin/master-data` and select the "Currencies" radio button. Settle lookup grid rows match database configuration seeding.
- Navigate to `/admin/audit-logs`. Filter by the date range for today. Select the log grid row corresponding to the password reset. Verify the metadata panel displays correct IP address and User Agent.
