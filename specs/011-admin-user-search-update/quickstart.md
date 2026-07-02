# Quickstart & Validation

1. **Start the backend server:**
   ```bash
   npm run start:dev
   ```

2. **Start the frontend server:**
   ```bash
   cd frontend
   npm run dev
   ```

3. **Log in as Admin** and navigate to the User Management screen.

4. **Verify Employee Number Search**:
   - Type "123" into the "Employee Number" box (visual prefix "EMP-" should stay static).
   - Verify network tab: request sent is `/api/v1/admin/users?employeeNumber=123`.
   - Results should only include users with employee number matching 123.

5. **Verify Employee Name Search**:
   - Clear Employee Number, type "Test" into "Employee Name" box.
   - Verify network tab: request sent is `/api/v1/admin/users?employeeName=Test`.
   - Results should only include users with "Test" in their name.

6. **Verify Combined Search (AND condition)**:
   - Type "123" in Employee Number AND "Test" in Employee Name.
   - Verify network tab: request sent is `/api/v1/admin/users?employeeNumber=123&employeeName=Test`.
   - Results should only include users that match both criteria.
