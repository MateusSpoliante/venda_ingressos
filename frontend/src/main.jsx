import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import App from "./App.jsx";
import Login from "./pages/Login/Login.jsx";
import Cadastro from "./pages/Cadastro/Cadastro.jsx";
import Home from "./pages/Home/Home.jsx";
import HomeOrg from "./pages/HomeOrg/HomeOrg.jsx"; // import adicionado
import PrivateRoute from "./components/PrivateRoute.jsx";
import { CartProvider } from "../src/context/CartContext/CartContext.jsx";
import Cart from "./pages/Cart/Cart.jsx";
import Evento from "./pages/Evento/Evento.jsx";
import Pagamento from "./pages/Pagamento/Pagamento.jsx";

const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
    children: [
      { index: true, element: <Login /> },
      { path: "login", element: <Login /> },
      { path: "cadastro", element: <Cadastro /> },
      {
        path: "home",
        element: (
          <PrivateRoute tipo="cliente">
            <Home />
          </PrivateRoute>
        ),
      },
      {
        path: "homeorg",
        element: (
          <PrivateRoute tipo="organizador">
            <HomeOrg />
          </PrivateRoute>
        ),
      },

      {
        path: "carrinho",
        element: (
          <PrivateRoute>
            <Cart />
          </PrivateRoute>
        ),
      },
      {
        path: "evento/:id",
        element: (
          <PrivateRoute>
            <Evento />
          </PrivateRoute>
        ),
      },
      {
        path: "pagamento",
        element: (
          <PrivateRoute>
            <Pagamento />
          </PrivateRoute>
        ),
      },
      { path: "*", element: <Login /> },
    ],
  },
]);

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <CartProvider>
      <RouterProvider router={router} />
    </CartProvider>
  </StrictMode>
);
