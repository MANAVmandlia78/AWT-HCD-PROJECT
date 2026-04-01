import { Navigate } from "react-router-dom";
import { getUser } from "../utils/auth";

const PublicRoute = ({ children }) => {
  const user = getUser();

  // If already logged in → block access to login/signup
  if (user) {
    return <Navigate to="/dashboard" />;
  }

  return children;
};

export default PublicRoute;