// src/components/LocalForm.jsx
import { useState, useEffect } from "react";

function LocalForm({ onChange }) {
  const [estados, setEstados] = useState([]);
  const [cidades, setCidades] = useState([]);
  const [estado, setEstado] = useState("");
  const [cidade, setCidade] = useState("");

  // Buscar todos os estados ao montar o componente
  useEffect(() => {
    fetch("https://servicodados.ibge.gov.br/api/v1/localidades/estados")
      .then((res) => res.json())
      .then((data) => {
        // Ordenar estados por nome
        const sorted = data.sort((a, b) => a.nome.localeCompare(b.nome));
        setEstados(sorted);
      })
      .catch((err) => console.error("Erro ao buscar estados:", err));
  }, []);

  // Quando o usuário seleciona um estado, buscar cidades desse estado
  const handleEstadoChange = (e) => {
    const uf = e.target.value;
    setEstado(uf);
    setCidade("");
    onChange({ estado: uf, cidade: "" });

    if (uf) {
      fetch(`https://servicodados.ibge.gov.br/api/v1/localidades/estados/${uf}/municipios`)
        .then((res) => res.json())
        .then((data) => {
          const sortedCities = data.sort((a, b) => a.nome.localeCompare(b.nome));
          setCidades(sortedCities);
        })
        .catch((err) => console.error("Erro ao buscar cidades:", err));
    } else {
      setCidades([]);
    }
  };

  const handleCidadeChange = (e) => {
    const val = e.target.value;
    setCidade(val);
    onChange({ estado, cidade: val });
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
      <label>Estado:</label>
      <select value={estado} onChange={handleEstadoChange}>
        <option value="">Selecione um estado</option>
        {estados.map((e) => (
          <option key={e.id} value={e.sigla}>
            {e.nome}
          </option>
        ))}
      </select>

      <label>Cidade:</label>
      <select value={cidade} onChange={handleCidadeChange} disabled={!estado}>
        <option value="">Selecione uma cidade</option>
        {cidades.map((c) => (
          <option key={c.id} value={c.nome}>
            {c.nome}
          </option>
        ))}
      </select>
    </div>
  );
}

export default LocalForm;
