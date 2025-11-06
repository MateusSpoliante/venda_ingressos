import { useState } from "react";
import "./CreateEvent.css";
import LocalForm from "../LocalForm.jsx";

function CreateEvent({ onEventoCriado }) {
  const [titulo, setTitulo] = useState("");
  const [descricao, setDescricao] = useState("");
  const [data, setData] = useState("");
  const [localData, setLocalData] = useState({ estado: "", cidade: "" });
  const [local, setLocal] = useState("");
  const [categoria, setCategoria] = useState("Teatro");
  const [imagem, setImagem] = useState(null);
  const [loading, setLoading] = useState(false);

  const categorias = [
    "Teatro",
    "Musical",
    "Stand up",
    "Infantil",
    "Dança",
    "Shows",
    "Circo",
    "Palestras",
    "Religioso",
  ];

  const handleLocalChange = ({ estado, cidade }) => {
    setLocalData({ estado, cidade });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData();
    formData.append("titulo", titulo);
    formData.append("descricao", descricao);
    formData.append("data_evento", data);
    formData.append("estado", localData.estado);
    formData.append("cidade", localData.cidade);
    formData.append("local", local);
    formData.append("categoria", categoria);
    if (imagem) formData.append("imagem", imagem);

    const token = localStorage.getItem("token");

    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/api/organizador/eventos`,
        {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
          body: formData,
        }
      );

      const result = await res.json();
      if (res.ok) {
        onEventoCriado(result);
        alert("Evento criado com sucesso!");
        window.location.reload();
      } else {
        alert(result.erro || "Erro ao criar evento");
      }
    } catch (err) {
      console.error(err);
      alert("Erro ao criar evento.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className="create-event" onSubmit={handleSubmit}>
      <input
        type="text"
        placeholder="Título do evento"
        value={titulo}
        onChange={(e) => setTitulo(e.target.value)}
        required
      />

      <textarea
        placeholder="Descrição do evento"
        value={descricao}
        onChange={(e) => setDescricao(e.target.value)}
        required
      />

    {/*   <label
        htmlFor="data"
        style={{
          marginBottom: "-6px",
        }}
      >
        Data e hora do evento
      </label> */}
      <input
        id="data"
        type="datetime-local"
        value={data}
        onChange={(e) => setData(e.target.value)}
        required
        style={{ marginBottom: "12px" }}
      />

      <LocalForm onChange={handleLocalChange} />

      <input
        type="text"
        placeholder="Local onde irá acontecer o evento (ex: Teatro Municipal)"
        value={local}
        onChange={(e) => setLocal(e.target.value)}
        required
      />

      <select
        value={categoria}
        onChange={(e) => setCategoria(e.target.value)}
        required
      >
        {categorias.map((cat) => (
          <option key={cat} value={cat}>
            {cat}
          </option>
        ))}
      </select>

      <input className="imgUpload"
        type="file"
        accept="image/*"
        onChange={(e) => setImagem(e.target.files[0])}
      />

      <button type="submit" disabled={loading}>
        {loading ? "Criando..." : "Criar Evento"}
      </button>
    </form>
  );
}

export default CreateEvent;
