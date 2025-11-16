import { useState } from "react";
import { useParams } from "react-router-dom";
import "./CreateTicketForm.css";

export default function CreateIngresso() {
  const { id } = useParams(); // id do evento
  const [form, setForm] = useState({
    tipo_ingresso: "",
    preco: "",
    quantidade: "",
    limite_por_cpf: "" // ADICIONADO
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const token = localStorage.getItem("token");
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/api/organizador/ingressos`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            evento_id: id,
            ...form,
          }),
        }
      );

      if (!res.ok) throw new Error("Erro ao criar ingresso");

      alert("Ingresso criado com sucesso!");
      window.location.reload();
    } catch (err) {
      console.error(err);
      alert("Erro ao criar ingresso");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="create-ingresso-page">
      <div className="create-ingresso-card">
        <h2>Criar Ingresso</h2>
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            name="tipo_ingresso"
            value={form.tipo_ingresso}
            onChange={handleChange}
            placeholder="Tipo de ingresso (Ex: Pista, VIP...)"
            required
          />

          <input
            type="number"
            name="preco"
            value={form.preco}
            onChange={handleChange}
            placeholder="Preço"
            required
            step="0.01"
            min="0"
          />

          <input
            type="number"
            name="quantidade"
            value={form.quantidade}
            onChange={handleChange}
            placeholder="Quantidade disponível"
            required
            min="1"
          />

          {/* NOVO CAMPO */}
          <input
            type="number"
            name="limite_por_cpf"
            value={form.limite_por_cpf}
            onChange={handleChange}
            placeholder="Limite por CPF (ex: 2, 4...)"
            min="0"
            required
          />

          <button type="submit" disabled={loading}>
            {loading ? "Salvando..." : "Criar Ingresso"}
          </button>
        </form>
      </div>
    </div>
  );
}
