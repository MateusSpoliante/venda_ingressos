import { Navigate } from "react-router-dom";
import jwtDecode from "jwt-decode";

const PrivateRoute = ({ children }) => {
  const token = localStorage.getItem("token");

  if (!token) return <Navigate to="/login" />;

  try {
    const { exp } = jwtDecode(token);
    if (Date.now() >= exp * 1000) {
      localStorage.removeItem("token");
      localStorage.removeItem("nome");
      return <Navigate to="/login" />;
    }
  } catch {
    return <Navigate to="/login" />;
  }

  return children;
};

export default PrivateRoute;
