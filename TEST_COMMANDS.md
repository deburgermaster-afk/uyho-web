# 🧪 UYHO Website - Test Commands Guide

## Prerequisites
- Node.js running server: `node server.js` (already running on port 5000)
- curl installed (comes with macOS)
- Python 3 for JSON formatting (optional but recommended)

---

## Quick Test - Copy & Paste Ready

### 1️⃣ Register a New Volunteer

```bash
curl -X POST http://localhost:5000/api/volunteers/register \
  -H "Content-Type: application/json" \
  -d '{
    "fullName": "John Developer",
    "email": "john.dev@example.com",
    "password": "TestPass123!",
    "phone": "555-1234",
    "age": 28,
    "address": "100 Tech Street",
    "wing": "Technology Wing",
    "availability": ["weekends"]
  }' | python3 -m json.tool
```

**Expected Output:**
```json
{
    "id": X,
    "fullName": "John Developer",
    "email": "john.dev@example.com",
    "digitalId": "UYHO-2026-00X",
    "message": "Registration successful! Your volunteer ID is UYHO-2026-00X"
}
```

**Note the ID from response (e.g., 4) - you'll need it for next steps**

---

### 2️⃣ Get Profile (Replace 4 with your ID)

```bash
curl -s http://localhost:5000/api/volunteers/4 | python3 -m json.tool
```

**Expected Output:**
```json
{
    "id": 4,
    "full_name": "John Developer",
    "email": "john.dev@example.com",
    "phone": "555-1234",
    "age": 28,
    "address": "100 Tech Street",
    "wing": "Technology Wing",
    "avatar": "",
    "education": null,
    "lives_impacted": 0,
    "teams_led": 0,
    "hours_given": 0,
    "availability": ["weekends"],
    "digital_id": "UYHO-2026-004",
    ...more fields...
}
```

✅ **Verify**: Education field is present (currently null)

---

### 3️⃣ Update Profile with All Fields (Replace 4 with your ID)

```bash
curl -X PUT http://localhost:5000/api/volunteers/4 \
  -H "Content-Type: application/json" \
  -d '{
    "fullName": "John Developer Pro",
    "phone": "555-4321",
    "address": "200 Developer Ave Suite 500",
    "wing": "Technology Wing",
    "education": "Masters in Computer Science",
    "avatar": "/avatars/john_dev.jpg"
  }' | python3 -m json.tool
```

**Expected Output:**
```json
{
    "success": true,
    "message": "Profile updated"
}
```

✅ **Verify**: Returns success message

---

### 4️⃣ Get Updated Profile (Replace 4 with your ID)

```bash
curl -s http://localhost:5000/api/volunteers/4 | python3 -m json.tool
```

**Expected Output:**
```json
{
    "id": 4,
    "full_name": "John Developer Pro",
    "email": "john.dev@example.com",
    "phone": "555-4321",
    "address": "200 Developer Ave Suite 500",
    "wing": "Technology Wing",
    "avatar": "/avatars/john_dev.jpg",
    "education": "Masters in Computer Science",
    ...more fields...
}
```

✅ **Verify**: 
- Name updated to "John Developer Pro"
- Phone changed to "555-4321"
- Address updated
- Education shows "Masters in Computer Science"
- Avatar path stored correctly

---

### 5️⃣ Login Test (Replace with your email/password)

```bash
curl -X POST http://localhost:5000/api/volunteers/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john.dev@example.com",
    "password": "TestPass123!"
  }' | python3 -m json.tool
```

**Expected Output:**
```json
{
    "id": 4,
    "full_name": "John Developer Pro",
    "email": "john.dev@example.com",
    "phone": "555-4321",
    "education": "Masters in Computer Science",
    ...more fields...
}
```

✅ **Verify**: 
- Login returns complete profile
- Password not included in response
- All updated fields present

---

## Testing Individual Features

### Test Field Update - Name Only
```bash
curl -X PUT http://localhost:5000/api/volunteers/4 \
  -H "Content-Type: application/json" \
  -d '{
    "fullName": "Jane Developer",
    "phone": "",
    "address": "",
    "wing": "",
    "education": ""
  }' | python3 -m json.tool
```
✅ Should handle empty fields gracefully

### Test Field Update - Education Only
```bash
curl -X PUT http://localhost:5000/api/volunteers/4 \
  -H "Content-Type: application/json" \
  -d '{
    "fullName": "Jane Developer",
    "phone": "555-4321",
    "address": "200 Developer Ave",
    "wing": "Technology Wing",
    "education": "PhD in Artificial Intelligence"
  }' | python3 -m json.tool
```
✅ Education field should update correctly

### Test Multiple Updates
```bash
# Update 1
curl -X PUT http://localhost:5000/api/volunteers/4 \
  -H "Content-Type: application/json" \
  -d '{"fullName":"Update1","phone":"1","address":"a","wing":"w","education":"e"}' | python3 -c "import sys,json; print('Update 1:', json.load(sys.stdin)['success'])"

# Update 2
curl -X PUT http://localhost:5000/api/volunteers/4 \
  -H "Content-Type: application/json" \
  -d '{"fullName":"Update2","phone":"2","address":"b","wing":"x","education":"e2"}' | python3 -c "import sys,json; print('Update 2:', json.load(sys.stdin)['success'])"

# Verify
curl -s http://localhost:5000/api/volunteers/4 | python3 -c "import sys,json; d=json.load(sys.stdin); print('Final Name:', d['full_name'], '| Education:', d['education'])"
```
✅ Should show latest updates

---

## Database Verification

### Check How Many Volunteers Exist
```bash
sqlite3 /Users/macbookpro/Downloads/uyho-web/team.db "SELECT COUNT(*) as total FROM volunteers;"
```

### Check All Volunteer Names and Emails
```bash
sqlite3 /Users/macbookpro/Downloads/uyho-web/team.db "SELECT id, full_name, email, education FROM volunteers;"
```

### Check Specific Volunteer (Replace 4 with ID)
```bash
sqlite3 /Users/macbookpro/Downloads/uyho-web/team.db "SELECT * FROM volunteers WHERE id = 4;"
```

### Check Database Schema
```bash
sqlite3 /Users/macbookpro/Downloads/uyho-web/team.db ".schema volunteers"
```

---

## Troubleshooting

### Server Not Running?
```bash
# Check if port 5000 is in use
lsof -i :5000

# If needed, kill and restart
pkill -f "node server.js"
node /Users/macbookpro/Downloads/uyho-web/server.js
```

### Getting Connection Refused?
```bash
# Make sure you're in the right directory
cd /Users/macbookpro/Downloads/uyho-web

# Restart the server
npm run server
# or
node server.js
```

### Database Locked or Corrupted?
```bash
# Delete and recreate database (CAUTION: Loses data)
rm team.db
node server.js  # Restart to recreate

# Or backup first
cp team.db team.db.backup
rm team.db
node server.js
```

### JSON Formatting Not Working?
```bash
# If python3 -m json.tool doesn't work, use jq instead
brew install jq

# Then use:
curl -s http://localhost:5000/api/volunteers/4 | jq .
```

---

## Quick Test Summary

✅ **What to Verify:**
1. Can register new volunteer
2. Can retrieve profile (education shows)
3. Can update all fields including education
4. Can login with correct credentials
5. Updated data persists in database
6. Empty fields don't cause errors

✅ **Success Criteria:**
- Registration returns volunteer ID
- Get profile returns education field
- Update returns success message
- Updated data shows in get profile
- Database contains updated values

---

## Expected Test Results

### Successful Test Run
```
✅ Volunteer ID 4 created
✅ Profile retrieved with education: null
✅ Profile updated successfully
✅ Updated data verified:
   - Name: John Developer Pro
   - Education: Masters in Computer Science
   - Avatar: /avatars/john_dev.jpg
✅ Login successful
✅ Database persisted all changes
```

### All Features Working
- Registration ✅
- Profile view ✅
- Profile update ✅
- Education field ✅
- Avatar path ✅
- Login ✅
- Database persistence ✅

---

**Test Date**: January 23, 2026
**Status**: All systems operational ✅
