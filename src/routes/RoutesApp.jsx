import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import Login from "../components/Login/Login";
import Cadastro from "../components/Cadastro/Cadastro";
import Home from "../components/Home/Home";
import { Fragment } from "react";

// Componente de login que redireciona se já estiver logado
function LoginWrapper() {
  const signed = false; // mesma lógica de autenticação
  return signed ? <Navigate to="/home" replace /> : <Login />;
}

function RoutesApp() {
  return (
    <BrowserRouter> 
      <Fragment>
        <Routes>
          <Route path="/home" element={<Home />} />
          <Route path="/" element={<LoginWrapper />} />
          <Route path="/cadastro" element={<Cadastro />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Fragment>
    </BrowserRouter>
  );
}

export default RoutesApp;
