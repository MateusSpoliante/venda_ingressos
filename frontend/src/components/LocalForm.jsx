import { useState, useEffect } from "react";
import "./CreateEventForm/CreateEvent.css";

function LocalForm({ onChange }) {
  const [estados, setEstados] = useState([]);
  const [cidades, setCidades] = useState([]);
  const [estado, setEstado] = useState("");
  const [cidade, setCidade] = useState("");

  useEffect(() => {
    fetch("https://servicodados.ibge.gov.br/api/v1/localidades/estados")
      .then((res) => res.json())
      .then((data) => {
        const sorted = data.sort((a, b) => a.nome.localeCompare(b.nome));
        setEstados(sorted);
      })
      .catch((err) => console.error("Erro ao buscar estados:", err));
  }, []);

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
    <div className="state-city-wrapper">
      <select value={estado} onChange={handleEstadoChange} required>
        <option value="">Selecione um estado</option>
        {estados.map((e) => (
          <option key={e.id} value={e.sigla}>
            {e.nome}
          </option>
        ))}
      </select>

      <select
        value={cidade}
        onChange={handleCidadeChange}
        disabled={!estado}
        required
      >
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
