import { useState, useEffect } from 'react'
import { Outlet, Route, BrowserRouter as Router, Routes, Navigate, useLocation } from 'react-router-dom'

// ScrollToTop component - scrolls to top on every navigation
function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    // Scroll to top on every route change
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }, [pathname]);

  return null;
}
import Footer from './components/Footer'
import Header from './components/Header'
import OfflineBar from './components/OfflineBar'
import SplashScreen from './components/SplashScreen'
import { AppProvider, useApp } from './context/AppContext'
import { OrgProvider } from './context/OrgContext'
import About from './pages/About'
import Activities from './pages/Activities'
import Campaigns from './pages/Campaigns'
import CampaignView from './pages/CampaignView'
import Contact from './pages/Contact'
import Donate from './pages/Donate'
import Donations from './pages/Donations'
import Downloads from './pages/Downloads'
import Home from './pages/Home'
import JoinUs from './pages/JoinUs'
import OrganizationChart from './pages/OrganizationChart'
import PublicDonatePage from './pages/PublicDonatePage'
import Wings from './pages/Wings'
import WingView from './pages/WingView'

// Volunteer Portal Pages
import VolunteerLayout from './components/VolunteerLayout'
import AlliesPage from './pages/volunteer/AlliesPage'
import AnnouncementsPage from './pages/volunteer/AnnouncementsPage'
import BadgesPage from './pages/volunteer/BadgesPage'
import BadgeDetailPage from './pages/volunteer/BadgeDetailPage'
import CampaignApplyPage from './pages/volunteer/CampaignApplyPage'
import CampaignDetailsPage from './pages/volunteer/CampaignDetailsPage'
import CampaignRequestsPage from './pages/volunteer/CampaignRequestsPage'
import CampaignsPage from './pages/volunteer/CampaignsPage'
import ChatPage from './pages/volunteer/ChatPage'
import CourseDetailsPage from './pages/volunteer/CourseDetailsPage'
import CoursesPage from './pages/volunteer/CoursesPage'
import CreateCoursePage from './pages/volunteer/CreateCoursePage'
import EditCoursePage from './pages/volunteer/EditCoursePage'
import CreateWingPage from './pages/volunteer/CreateWingPage'
import CreateWingPostPage from './pages/volunteer/CreateWingPostPage'
import DonationPage from './pages/volunteer/DonationPage'
import DonationRequestsPage from './pages/volunteer/DonationRequestsPage'
import DirectAidViewPage from './pages/volunteer/DirectAidViewPage'
import CreateDirectAidPage from './pages/volunteer/CreateDirectAidPage'
import EditCampaignPage from './pages/volunteer/EditCampaignPage'
import EditProfilePage from './pages/volunteer/EditProfilePage'
import LeaderboardPage from './pages/volunteer/LeaderboardPage'
import LoginPage from './pages/volunteer/LoginPage'
import ManageCampaignPage from './pages/volunteer/ManageCampaignPage'
import OrgCommitteePage from './pages/volunteer/OrgCommitteePage'
import OrgGeneralPage from './pages/volunteer/OrgGeneralPage'
import OrgRolesPage from './pages/volunteer/OrgRolesPage'
import PrivacySettingsPage from './pages/volunteer/PrivacySettingsPage'
import ProfilePage from './pages/volunteer/ProfilePage'
import ProgramDetailsPage from './pages/volunteer/ProgramDetailsPage'
import ProgramsPage from './pages/volunteer/ProgramsPage'
import SelectParentWingPage from './pages/volunteer/SelectParentWingPage'
import UmmahFundPage from './pages/volunteer/UmmahFundPage'
import NotificationsPage from './pages/volunteer/NotificationsPage'
import AccessManagementPage from './pages/volunteer/AccessManagementPage'
import ViewCampaignPage from './pages/volunteer/ViewCampaignPage'
import ViewProfilePage from './pages/volunteer/ViewProfilePage'
import ViewWingPage from './pages/volunteer/ViewWingPage'
import ValidateCertificatePage from './pages/volunteer/ValidateCertificatePage'
import VolunteerPortalHome from './pages/volunteer/VolunteerPortalHome'
import WingCampaignRequestPage from './pages/volunteer/WingCampaignRequestPage'
import WingDetailsPage from './pages/volunteer/WingDetailsPage'
import WingEditPage from './pages/volunteer/WingEditPage'
import WingsPage from './pages/volunteer/WingsPage'

// Protected Route Component
function ProtectedRoute({ children }) {
  const location = useLocation();
  const volunteerId = localStorage.getItem('volunteerId');

  if (!volunteerId) {
    return <Navigate to="/volunteer/login" state={{ from: location }} replace />;
  }

  return children;
}

// Protected Volunteer Layout
function ProtectedVolunteerLayout() {
  return (
    <ProtectedRoute>
      <VolunteerLayout />
    </ProtectedRoute>
  );
}

function AppContent() {
  const [showSplash, setShowSplash] = useState(true);

  // Set light mode by default, check localStorage for user preference
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, []);

  if (showSplash) {
    return <SplashScreen onComplete={() => setShowSplash(false)} />;
  }

  return (
    <>
      <ScrollToTop />
      <OfflineBar />
      <div className="bg-background-light dark:bg-background-dark text-slate-900 dark:text-slate-100 transition-colors duration-300 min-h-screen flex flex-col">
        <Routes>
          {/* Main Website Routes with Layout */}
          <Route element={<><Header /><main className="flex-1"><Outlet /></main><Footer /></>}>
            <Route path="/" element={<Home />} />
            <Route path="/about" element={<About />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/donate" element={<Donate />} />
            <Route path="/join" element={<JoinUs />} />
            <Route path="/wings" element={<Wings />} />
            <Route path="/wing/:id" element={<WingView />} />
            <Route path="/organization-chart" element={<OrganizationChart />} />
            <Route path="/activities" element={<Activities />} />
            <Route path="/campaigns" element={<Campaigns />} />
            <Route path="/campaigns/:id" element={<CampaignView />} />
            <Route path="/donations" element={<Donations />} />
            <Route path="/downloads" element={<Downloads />} />
          </Route>

          {/* Public Donation Page (no login required) */}
          <Route path="/donate/:type/:id" element={<PublicDonatePage />} />

          {/* Volunteer Portal Routes - Protected with Auth */}
          <Route path="/volunteer/login" element={<LoginPage />} />
          <Route element={<ProtectedVolunteerLayout />}>
            <Route path="/volunteer" element={<VolunteerPortalHome />} />
            <Route path="/volunteer/campaigns" element={<CampaignsPage />} />
            <Route path="/volunteer/campaigns/apply" element={<CampaignApplyPage />} />
            <Route path="/volunteer/campaigns/:id" element={<ViewCampaignPage />} />
            <Route path="/volunteer/campaigns/:id/edit" element={<EditCampaignPage />} />
            <Route path="/volunteer/campaigns/:id/manage" element={<ManageCampaignPage />} />
            <Route path="/volunteer/campaign/:id" element={<CampaignDetailsPage />} />
            <Route path="/volunteer/courses" element={<CoursesPage />} />
            <Route path="/volunteer/courses/create" element={<CreateCoursePage />} />
            <Route path="/volunteer/courses/:id" element={<CourseDetailsPage />} />
            <Route path="/volunteer/courses/:id/edit" element={<EditCoursePage />} />
            <Route path="/volunteer/badges" element={<BadgesPage />} />
            <Route path="/volunteer/badges/:badgeId" element={<BadgeDetailPage />} />
            <Route path="/volunteer/notifications" element={<NotificationsPage />} />
            <Route path="/volunteer/validate-certificate" element={<ValidateCertificatePage />} />
            <Route path="/volunteer/programs" element={<ProgramsPage />} />
            <Route path="/volunteer/program/:id" element={<ProgramDetailsPage />} />
            <Route path="/volunteer/chat" element={<ChatPage />} />
            <Route path="/volunteer/profile" element={<ProfilePage />} />
            <Route path="/volunteer/profile/:id" element={<ViewProfilePage />} />
            <Route path="/volunteer/allies/:id" element={<AlliesPage />} />
            <Route path="/volunteer/privacy-settings" element={<PrivacySettingsPage />} />
            <Route path="/volunteer/org/general" element={<OrgGeneralPage />} />
            <Route path="/volunteer/org/roles" element={<OrgRolesPage />} />
            <Route path="/volunteer/org/committee" element={<OrgCommitteePage />} />
            <Route path="/volunteer/campaign-requests" element={<CampaignRequestsPage />} />
            <Route path="/volunteer/wings" element={<WingsPage />} />
            <Route path="/volunteer/wings/create" element={<CreateWingPage />} />
            <Route path="/volunteer/wings/:id" element={<WingDetailsPage />} />
            <Route path="/volunteer/wing/:id" element={<ViewWingPage />} />
            <Route path="/volunteer/wing/:id/edit" element={<WingEditPage />} />
            <Route path="/volunteer/wing/:id/create-post" element={<CreateWingPostPage />} />
            <Route path="/volunteer/wing/:id/request-campaign" element={<WingCampaignRequestPage />} />
            <Route path="/volunteer/select-parent-wing" element={<SelectParentWingPage />} />
            <Route path="/volunteer/edit-profile" element={<EditProfilePage />} />
            <Route path="/volunteer/leaderboard" element={<LeaderboardPage />} />
            <Route path="/volunteer/donation" element={<DonationPage />} />
            <Route path="/volunteer/direct-aid/create" element={<CreateDirectAidPage />} />
            <Route path="/volunteer/direct-aid/:id" element={<DirectAidViewPage />} />
            <Route path="/volunteer/donation-requests" element={<DonationRequestsPage />} />
            <Route path="/volunteer/announcements" element={<AnnouncementsPage />} />
            <Route path="/volunteer/ummah-fund" element={<UmmahFundPage />} />
            <Route path="/volunteer/access" element={<AccessManagementPage />} />
          </Route>
        </Routes>
      </div>
    </>
  );
}

function App() {
  return (
    <AppProvider>
      <OrgProvider>
        <Router>
          <AppContent />
        </Router>
      </OrgProvider>
    </AppProvider>
  )
}

export default App
