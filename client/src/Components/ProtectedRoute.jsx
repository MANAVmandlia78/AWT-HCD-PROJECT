import { Navigate } from "react-router-dom";
import { getUser } from "../utils/auth";

const ProtectedRoute = ({ children }) => {
  const user = getUser();

  const logout = () => {
  localStorage.removeItem("token");
  window.location.href = "/login";
};

  if (!user) {
    return <Navigate to="/login" />;
  }

   if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/unauthorized" />;
  }

  return children;
};

export default ProtectedRoute;