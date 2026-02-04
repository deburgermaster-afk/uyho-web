import { Navigate, useLocation } from 'react-router-dom';

export default function ProtectedRoute({ children }) {
  const location = useLocation();
  const volunteerId = localStorage.getItem('volunteerId');

  if (!volunteerId) {
    // Redirect to login with return URL
    return <Navigate to="/volunteer/login" state={{ from: location }} replace />;
  }

  return children;
}
