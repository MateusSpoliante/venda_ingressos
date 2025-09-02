import { useState } from "react";
import "./App.css";
import Login from "./components/Login.jsx";
import Cadastro from "./components/Cadastro.jsx";

function App() {
  const [logado, setLogado] = useState(false);

  return (
    <div>
      {!logado ? <Login onLogin={() => setLogado(true)} /> : <Cadastro />}
    </div>
  );
}

export default App;
