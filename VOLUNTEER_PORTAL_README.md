# UYHO Volunteer Portal

A professional, mobile-first volunteer management platform integrated into the UYHO website.

## Features

### 📱 Portal Pages

1. **Home Dashboard** (`/volunteer`)
   - Welcome greeting with user stats
   - Daily mission card with featured campaign
   - Urgent tasks carousel
   - Featured programs section
   - Quick action buttons

2. **Campaigns** (`/volunteer/campaigns`)
   - Browse all available campaigns
   - Filter by category (Education, Healthcare, Disaster Relief)
   - Campaign status badges
   - Volunteer count and progress
   - Join campaigns with one click

3. **Campaign Details** (`/volunteer/campaign/:id`)
   - Detailed campaign information
   - Progress bar for volunteer recruitment
   - Category and difficulty level
   - Similar campaigns suggestions
   - Join/Share buttons

4. **Programs** (`/volunteer/programs`)
   - Available courses and training programs
   - Progress tracking for ongoing programs
   - Filter by status (Ongoing, Planning, Completed)
   - Enroll in programs
   - Participant count and dates

5. **Program Details** (`/volunteer/program/:id`)
   - Course curriculum with module breakdown
   - Progress tracking
   - Enrollment status
   - Course dates and participant info

6. **Chat** (`/volunteer/chat`)
   - Direct messaging with other volunteers
   - Group conversations (wings/teams)
   - Unread message indicators
   - Real-time chat interface
   - Message history

7. **Profile** (`/volunteer/profile`)
   - User statistics (hours, projects, rank)
   - Points and gamification tracking
   - Certificates and achievements
   - Activity history
   - Account settings
   - Edit profile options

8. **Leaderboard** (`/volunteer/leaderboard`)
   - Top volunteers by points
   - Top volunteers by hours
   - Organization wings overview
   - Wing heads and member counts
   - Ranking system with medals

## 🎨 Design System

### Header Component (VolunteerHeader)
- Dynamic page title
- Back navigation button
- Search and notifications
- Sticky positioning

### Footer Component (VolunteerFooter)
- Bottom navigation with 5 main sections
- Home, Campaigns, Programs, Chat, Profile
- Notification badges
- Active state indicators

### Color Scheme
- **Primary**: #1b8398 (Teal)
- **Background Light**: #ffffff
- **Background Dark**: #1b1b1d
- **Surface**: #2D2D2F (Dark mode surface)

### Typography
- **Font**: Manrope (Sans-serif)
- **Responsive**: Mobile-first design
- **Max Width**: 2xl (28rem) for optimal readability

## 📊 Demo Data

All pages use demo data for initial development:

- **User**: Ahmed Hassan (Active Volunteer)
- **Campaigns**: 3 campaigns with varying urgency levels
- **Programs**: 3 courses in different stages
- **Leaderboard**: 5 top volunteers
- **Wings**: 4 organization departments
- **Chats**: 3 active conversations

Located in: `src/pages/volunteer/demoData.js`

## 🔗 Navigation Structure

```
Home (/volunteer)
├── Campaigns (/volunteer/campaigns)
│   └── Campaign Details (/volunteer/campaign/:id)
├── Programs (/volunteer/programs)
│   └── Program Details (/volunteer/program/:id)
├── Chat (/volunteer/chat)
├── Profile (/volunteer/profile)
└── Leaderboard (/volunteer/leaderboard)
```

## 📱 Responsive Design

- Mobile-optimized with max-width constraints
- Touch-friendly button sizing
- Optimized for portrait orientation
- Adaptive typography
- Safe area padding

## 🚀 Getting Started

### Access the Portal

1. Click "Go to Portal" button on home page
2. Or navigate directly to `/volunteer`

### Demo Account

All pages are pre-populated with demo data:
- User: Ahmed Hassan
- Email: ahmed@uyho.org
- Role: Active Volunteer

## 🔄 Future Enhancements

- [x] Create portal structure with demo data
- [x] Build all main pages
- [x] Implement navigation system
- [ ] Backend integration
- [ ] Real user authentication
- [ ] Database integration for persistence
- [ ] Advanced filtering and search
- [ ] Real-time notifications
- [ ] File uploads for certifications
- [ ] Analytics and reporting

## 📁 File Structure

```
src/
├── components/
│   ├── VolunteerHeader.jsx
│   └── VolunteerFooter.jsx
├── pages/
│   └── volunteer/
│       ├── VolunteerPortalHome.jsx
│       ├── CampaignsPage.jsx
│       ├── CampaignDetailsPage.jsx
│       ├── ProgramsPage.jsx
│       ├── ProgramDetailsPage.jsx
│       ├── ChatPage.jsx
│       ├── ProfilePage.jsx
│       ├── LeaderboardPage.jsx
│       └── demoData.js
└── App.jsx (routes configured)
```

## 💾 Demo Data Schema

### User Object
```javascript
{
  id, name, email, avatar, role, 
  totalHours, projects, points, 
  joinedDate, status
}
```

### Campaign Object
```javascript
{
  id, title, description, image, location,
  status, urgency, hoursRequired, 
  volunteersNeeded, volunteersJoined, category
}
```

### Program Object
```javascript
{
  id, title, description, status, progress,
  startDate, endDate, participants, 
  category, image
}
```

## 🎯 Next Steps

1. **Backend Integration**: Connect to real API endpoints
2. **User Authentication**: Implement login/registration
3. **Database**: Replace demo data with real database
4. **Notifications**: Add real-time notification system
5. **Forms**: Implement profile editing
6. **File Management**: Add certificate uploads

---

**Portal Version**: 1.0.0  
**Last Updated**: January 2026  
**Status**: Demo with Full UI/UX
