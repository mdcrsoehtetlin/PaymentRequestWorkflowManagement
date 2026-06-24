# Specification: Fix Admin User Creation Password Validation Error

**Feature**: Fix admin user creation validation error
**Short Name**: fix-admin-user-creation
**Created**: 2026-06-24
**Status**: Draft

---

## 1. Problem Statement

When an administrator attempts to create a new user through the Admin Panel, the system displays the following validation errors and prevents user creation:

- "password must be shorter than or equal to 50 characters"
- "password must be longer than or equal to 8 characters"
- "password must be a string"
- "password should not be empty"

These errors appear even when the administrator does not intend to manually enter a password, because the system is designed to auto-generate a temporary password server-side.

---

## 2. User Scenarios & Testing

### Primary User Flow

1. **Given** an authenticated administrator is on the User Management dashboard
2. **When** the administrator clicks "Register New User" button
3. **And** fills in all required fields (Employee Number, Full Name, Email, Branch, Role)
4. **And** clicks "Save User"
5. **Then** the system should create the user account
6. **And** generate a temporary password automatically
7. **And** display the temporary password to the administrator
8. **And** the administrator should be able to share this temporary password with the new user

### Current Broken Flow

1. **Given** an authenticated administrator is on the User Management dashboard
2. **When** the administrator clicks "Register New User" button
3. **And** fills in all required fields
4. **And** clicks "Save User"
5. **Then** the system displays validation errors about the password field
6. **And** the user account is NOT created

### Edge Cases

- **Empty password field**: System should auto-generate password, not require manual entry
- **Password field omitted from request**: System should still auto-generate password
- **Password field included in request**: System should ignore it and auto-generate

---

## 3. Functional Requirements

### FR-001: Remove Password Field from User Creation Form
- The Admin Panel user registration form MUST NOT include a password input field
- The administrator MUST NOT be required to enter a password when creating a user

### FR-002: Auto-Generate Temporary Password
- The system MUST automatically generate a temporary password when a new user is created
- The temporary password MUST be at least 8 characters long
- The temporary password MUST contain alphanumeric characters only
- The temporary password MUST be displayed to the administrator after successful creation
  - **Display Method**: The API response SHALL include a `temporary_password` field containing the plaintext password
  - **Frontend Display**: The admin panel SHALL display the temporary password in a success message or modal after user creation
  - **Security**: The plaintext password SHALL NOT be stored or logged; it is only returned once in the creation response

### FR-003: Make Password Field Optional in DTO
- The `CreateUserDto.password` field MUST be marked as optional (`@IsOptional`)
- The validation decorators `@MinLength(8)` and `@MaxLength(50)` MUST be removed from the password field
- The system MUST NOT validate the password field if it is not provided

### FR-004: Maintain Password Security Standards
- The auto-generated temporary password MUST be hashed using bcrypt before storage
- The plaintext temporary password MUST only be returned in the API response (never stored)
- The temporary password MUST be transmitted over HTTPS only

---

## 4. Success Criteria

### Quantitative Metrics
- **100%** of admin user creation attempts succeed when all required fields are provided
- **0** validation errors related to password field during user creation
- **< 3 seconds** for user creation to complete (including password generation and hashing)

### Qualitative Measures
- Administrators can create users without confusion about password requirements
- The user creation workflow is intuitive and does not require password input
- Temporary passwords are securely generated and displayed only once

---

## 5. Key Entities

### User Account
- **employee_number**: Unique identifier (String, max 20 chars)
- **full_name**: User's full name (String, max 200 chars)
- **email**: User's email address (String, max 255 chars, unique)
- **branch**: Office branch (String, max 100 chars)
- **role_id**: Reference to user_roles table (Integer, foreign key)
- **is_active**: Account status flag (Boolean, default: true)
- **password_hash**: Hashed password (String, never exposed via API)

### Temporary Password
- **Generated server-side**: 8-character alphanumeric string
- **Lifecycle**: Generated → Displayed to admin → Hashed → Stored → Plaintext discarded
- **Purpose**: Initial login credential for new user

---

## 6. Assumptions

1. **Password generation is server-side only**: The system always generates passwords automatically; manual password entry is not a feature
2. **Temporary passwords are one-time use**: After first login, users are expected to change their password (or this is handled separately)
3. **Admin cannot set custom passwords**: The current design does not support admin-defined passwords; this is intentional for security
4. **Frontend does not send password field**: The React admin panel should not include a password field in the user creation form
5. **API backwards compatibility**: Existing API consumers that send a password field will have it ignored (not rejected)

---

## 7. Dependencies

### Internal Dependencies
- `AdminService.createUser()` method
- `CreateUserDto` validation decorators
- Admin Panel frontend (React components)

### External Dependencies
- bcrypt library for password hashing
- crypto module for random password generation

---

## 8. Out of Scope

- Custom password creation by administrators
- Password complexity requirements beyond length
- Password expiration policies
- User self-service password reset
- Password change workflow after first login

---

## 9. Risk Assessment

### Low Risk
- Removing unused validation decorators from DTO
- Making password field optional in DTO

### Medium Risk
- Ensuring frontend does not send empty password field that could cause issues
- Verifying API response includes temporary password correctly

### Mitigation
- Test user creation with and without password field in request
- Verify temporary password is displayed correctly in admin panel
- Confirm password hashing works with auto-generated passwords

---

## 10. Acceptance Criteria

- [ ] Administrator can create a new user without entering a password
- [ ] System generates a temporary password automatically
- [ ] Temporary password is displayed to administrator after user creation
- [ ] No validation errors related to password field appear during user creation
- [ ] New user can log in using the temporary password
- [ ] Password field is optional in the API request body
- [ ] Existing users with passwords are not affected
- [ ] All existing tests continue to pass

---

*End of Specification*
