import { Navigate } from "react-router-dom";
import { getUser } from "../utils/auth";

const ProtectedRoute = ({ children, allowedRoles }) => {
  const user = getUser();

  // ❌ Not logged in → redirect
  if (!user) {
    return <Navigate to="/login" />;
  }

  // ✅ Role-based protection (optional)
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/unauthorized" />;
  }

  return children;
};

export default ProtectedRoute;