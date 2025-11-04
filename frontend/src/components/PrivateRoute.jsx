import { Navigate } from "react-router-dom";
import jwtDecode from "jwt-decode";

const PrivateRoute = ({ children, tipo }) => {
  const token = localStorage.getItem("token");
  const organizador = localStorage.getItem("organizador"); // "S" ou "N"

  if (!token) return <Navigate to="/login" />;

  try {
    const { exp } = jwtDecode(token);
    if (Date.now() >= exp * 1000) {
      localStorage.removeItem("token");
      localStorage.removeItem("nome");
      localStorage.removeItem("organizador");
      return <Navigate to="/login" />;
    }
  } catch {
    return <Navigate to="/login" />;
  }

  // Verificação de tipo de usuário
  if (tipo === "organizador" && organizador !== "S")
    return <Navigate to="/home" />;

  if (tipo === "cliente" && organizador === "S")
    return <Navigate to="/homeOrg" />;

  return children;
};

export default PrivateRoute;
