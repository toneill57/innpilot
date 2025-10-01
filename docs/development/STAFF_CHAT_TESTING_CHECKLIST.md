# Staff Chat System - Manual Testing Checklist

This checklist corresponds to the manual testing requirements from plan.md (lines 1036-1049).

**Test Date:** _____________
**Tester:** _____________
**Environment:** Dev / Staging / Production
**Base URL:** http://localhost:3000

---

## Prerequisites

Before testing, ensure:
- [ ] Dev server is running (`npm run dev`)
- [ ] Database has test staff users (run `npm run test:e2e:setup` if needed)
- [ ] You have credentials for CEO, Admin, and Housekeeper test users
- [ ] Supabase is connected and operational

---

## 1. Authentication Tests

### 1.1 Valid Login
- [ ] **Staff login works with valid credentials**
  - Navigate to `/staff/login`
  - Select tenant: `test-hotel`
  - Enter username: `ceo-test`
  - Enter password: `test123456`
  - Click "Sign In"
  - ✅ Should redirect to `/staff`
  - ✅ Should show staff name in header
  - ✅ Should show role badge (CEO)
  - ✅ JWT token stored in localStorage

### 1.2 Invalid Login
- [ ] **Staff login fails with invalid password**
  - Navigate to `/staff/login`
  - Select tenant: `test-hotel`
  - Enter username: `ceo-test`
  - Enter password: `wrongpassword`
  - Click "Sign In"
  - ✅ Should show error message
  - ✅ Should remain on login page
  - ✅ No token in localStorage

### 1.3 Inactive Account
- [ ] **Staff login fails for inactive account**
  - Navigate to `/staff/login`
  - Select tenant: `test-hotel`
  - Enter username: `inactive-staff`
  - Enter password: `test123456`
  - Click "Sign In"
  - ✅ Should show "Account inactive" error
  - ✅ Should remain on login page

### 1.4 Token Expiry
- [ ] **Logout invalidates token**
  - Login successfully
  - Click "Logout" button
  - ✅ Should redirect to `/staff/login`
  - ✅ Token removed from localStorage
  - Try to manually navigate to `/staff`
  - ✅ Should redirect back to login

---

## 2. Role-Based Access Tests

### 2.1 CEO Access
- [ ] **CEO can access all content**
  - Login as `ceo-test`
  - Verify role badge shows "CEO" (gold color)
  - Ask: "¿Cómo puedo acceder a los reportes financieros?"
  - ✅ Should receive detailed response
  - ✅ Should show sources
  - ✅ No permission denied message

### 2.2 Admin Access
- [ ] **Admin can access operational content**
  - Login as `admin-test`
  - Verify role badge shows "ADMIN" (blue color)
  - Ask: "¿Cuál es el procedimiento para check-in?"
  - ✅ Should receive detailed response
  - ✅ Should show sources
  - Ask: "¿Cómo accedo al panel administrativo?" (admin-only)
  - ✅ Should have limited/denied access

### 2.3 Housekeeper Access
- [ ] **Housekeeper has limited access**
  - Login as `housekeeper-test`
  - Verify role badge shows "HOUSEKEEPER" (green color)
  - Ask: "¿Cuál es el checklist de limpieza?"
  - ✅ Should receive response (has access to operations)
  - Ask: "¿Cómo veo los reportes financieros?" (admin-only)
  - ✅ Should be denied or receive limited response

---

## 3. Content Query Tests

### 3.1 SIRE Queries
- [ ] **SIRE queries return correct content**
  - Login as any staff user with SIRE access (CEO or Admin)
  - Ask: "¿Cuáles son los requisitos para validar un reporte SIRE?"
  - ✅ Response mentions SIRE, validation, or compliance
  - ✅ Professional tone (not casual)
  - ✅ Sources include SIRE documents
  - Expand sources drawer
  - ✅ Similarity scores shown (bars)
  - ✅ Can copy source content

### 3.2 Operations Queries
- [ ] **Operations queries return hotel-specific info**
  - Login as any staff user
  - Ask: "¿Cuál es el procedimiento para check-in de huéspedes?"
  - ✅ Response mentions check-in procedures
  - ✅ Professional tone
  - ✅ Sources include hotel operations content
  - ✅ Information is relevant to test-hotel tenant

### 3.3 Housekeeping Queries
- [ ] **Housekeeping queries work correctly**
  - Login as housekeeper or admin
  - Ask: "¿Cuál es el checklist de limpieza de habitaciones?"
  - ✅ Response mentions cleaning checklist
  - ✅ Step-by-step procedures provided
  - ✅ Sources include operations manual

---

## 4. Conversation Management Tests

### 4.1 Message Persistence
- [ ] **Messages persist in database**
  - Login and send a message
  - Wait for response
  - Reload the page
  - ✅ Previous messages still visible
  - ✅ Conversation continues from where it left off

### 4.2 Conversation History
- [ ] **Conversation history loads correctly**
  - Send multiple messages in a conversation
  - Click "New Conversation"
  - Send message in new conversation
  - ✅ Sidebar shows both conversations
  - Click on first conversation
  - ✅ First conversation's messages load
  - ✅ Can switch between conversations

### 4.3 New Conversation
- [ ] **New conversation button works**
  - Click "New Conversation" button
  - ✅ Chat area clears
  - Send a message
  - ✅ New conversation appears in sidebar
  - ✅ Has auto-generated title or "New Conversation"

---

## 5. UI/UX Tests

### 5.1 Desktop Layout
- [ ] **Desktop layout works correctly**
  - Open on desktop (>1024px width)
  - ✅ Sidebar visible on left (20%)
  - ✅ Chat area on right (80%)
  - ✅ Header shows logo, name, role, logout
  - ✅ All elements properly aligned

### 5.2 Mobile Layout
- [ ] **Mobile responsive design works**
  - Resize browser to mobile width (<768px)
  - ✅ Sidebar collapses
  - ✅ Hamburger menu appears
  - Click hamburger menu
  - ✅ Sidebar opens
  - ✅ Can close sidebar
  - ✅ Chat area takes full width

### 5.3 Animations
- [ ] **Animations work smoothly**
  - Send a message
  - ✅ Loading dots appear
  - ✅ New messages fade in
  - ✅ Auto-scroll to bottom is smooth
  - ✅ No janky animations

### 5.4 Input Behavior
- [ ] **Input field works correctly**
  - Type a message
  - ✅ Textarea auto-expands
  - Press Enter
  - ✅ Sends message (not newline)
  - Type message, press Shift+Enter
  - ✅ Creates newline (doesn't send)
  - Continue typing, press Enter
  - ✅ Sends multi-line message

---

## 6. Error Handling Tests

### 6.1 Network Errors
- [ ] **Network errors handled gracefully**
  - Turn off internet or stop dev server
  - Try to send a message
  - ✅ Error message appears
  - ✅ "Retry" button shown
  - Turn internet back on
  - Click "Retry"
  - ✅ Message sends successfully

### 6.2 Invalid Inputs
- [ ] **Form validation works**
  - Login page: leave fields empty
  - ✅ Submit button disabled or shows errors
  - Enter short password (<6 chars)
  - ✅ Shows validation error
  - Chat: try to send empty message
  - ✅ Send button disabled

### 6.3 Session Management
- [ ] **Session expiry handled**
  - Login successfully
  - Clear localStorage (simulate expiry)
  - Try to interact with chat
  - ✅ Redirects to login
  - ✅ Shows appropriate message

---

## 7. Security Tests

### 7.1 JWT Token
- [ ] **JWT token properly formatted**
  - Login successfully
  - Open browser DevTools → Application → Local Storage
  - Check `staff_token`
  - ✅ Token exists
  - ✅ Follows JWT format (3 parts separated by dots)
  - Decode JWT (use jwt.io)
  - ✅ Contains staff_id, tenant_id, role, permissions

### 7.2 Protected Routes
- [ ] **Cannot access /staff without auth**
  - Clear localStorage
  - Navigate directly to `/staff`
  - ✅ Redirects to `/staff/login`
  - ✅ Shows appropriate message

### 7.3 Tenant Isolation
- [ ] **Staff only sees their tenant's data**
  - Login as test-hotel staff
  - Ask operational question
  - ✅ Responses are specific to test-hotel
  - ✅ No data from other tenants

---

## 8. Performance Tests

### 8.1 Response Time
- [ ] **Chat responses are reasonably fast**
  - Send a simple query
  - ✅ Response appears within 5-10 seconds
  - ✅ No excessive delays
  - ✅ Loading indicators work

### 8.2 UI Performance
- [ ] **UI remains responsive**
  - Send multiple messages quickly
  - ✅ No lag or freezing
  - ✅ Smooth animations
  - Scroll through long conversation
  - ✅ Smooth scrolling

---

## 9. Sources & Attribution Tests

### 9.1 Sources Display
- [ ] **Sources displayed correctly**
  - Send any query
  - Wait for response
  - ✅ Sources drawer visible
  - Click to expand
  - ✅ Shows source items
  - ✅ Table name visible
  - ✅ Similarity score shown (bar and percentage)
  - ✅ Content preview visible

### 9.2 Copy Functionality
- [ ] **Copy content works**
  - Expand sources
  - Click "Copy" button on a source
  - ✅ Shows "Copied!" feedback
  - Paste in a text editor
  - ✅ Content copied correctly

---

## 10. Professional Aesthetic Tests

### 10.1 Colors & Styling
- [ ] **Professional design confirmed**
  - ✅ Uses corporate blues/grays (not tropical colors)
  - ✅ Clean, modern fonts
  - ✅ Proper spacing and alignment
  - ✅ Role badges color-coded:
    - CEO: Gold
    - Admin: Blue
    - Housekeeper: Green

### 10.2 Consistency
- [ ] **Design consistency**
  - ✅ All buttons have consistent styling
  - ✅ Forms have consistent layout
  - ✅ Error messages have consistent styling
  - ✅ No design inconsistencies

---

## Summary

**Total Tests:** 50+
**Passed:** _____
**Failed:** _____
**Blocked:** _____

### Critical Issues Found
1.
2.
3.

### Minor Issues Found
1.
2.
3.

### Recommendations
1.
2.
3.

---

**Sign-off:**
**Tester:** _______________
**Date:** _______________
**Status:** ☐ Passed ☐ Failed ☐ Needs Revision
