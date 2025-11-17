import { useState } from "react";
import axios from "axios";
import "./TransferirModal.css";

export default function TransferirModal({ ingresso, onClose, onTransferido }) {
  const [cpf, setCpf] = useState("");
  const [valor, setValor] = useState("");
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState("");

  const precoMaximo = ingresso?.preco ? parseFloat(ingresso.preco) : 0;
  const precoFormatado = precoMaximo.toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  function formatarValorInput(value) {
    let numeros = value.replace(/[^0-9,]/g, "");
    const partes = numeros.split(",");
    if (partes.length > 2) {
      numeros = partes[0] + "," + partes[1];
    }
    return numeros;
  }

  async function handleTransferir(e) {
    e.preventDefault();
    setErro("");

    const valorNumerico = valor ? parseFloat(valor.replace(",", ".")) : null;
    if (valorNumerico && valorNumerico > precoMaximo) {
      setErro(
        `O valor não pode ser maior que o preço do ingresso (R$ ${precoFormatado})`
      );
      return;
    }

    // Normaliza CPF digitado
    const cpfNormalizado = cpf.replace(/\D/g, "");

    // Pega CPF do usuário logado do localStorage
    const cpfUsuarioLogado = localStorage.getItem("cpfCnpj")?.replace(/\D/g, "");

    // Validação: não pode transferir para o próprio usuário
    if (cpfNormalizado === cpfUsuarioLogado) {
      setErro("Não é possível transferir ingresso para você mesmo");
      return;
    }

    setLoading(true);

    try {
      const token = localStorage.getItem("token");

      const { data } = await axios.post(
        `${import.meta.env.VITE_API_URL}/api/ingressos/transferir`,
        {
          ingresso_id: ingresso.id || ingresso.ingresso_id,
          cpf_destinatario: cpfNormalizado,
          valor: valorNumerico,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      onTransferido(data.transferencia);
      onClose();
    } catch (err) {
      setErro(err.response?.data?.erro || "Erro ao transferir ingresso");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <h2>Transferir Ingresso</h2>

        <p>
          {ingresso.evento_titulo || ingresso.evento_nome} – {ingresso.tipo_ingresso}
        </p>

        <form onSubmit={handleTransferir}>
          <label>
            CPF do destinatário:
            <input
              type="text"
              value={cpf}
              onChange={(e) => setCpf(e.target.value)}
              required
            />
          </label>

          <label>
            Valor (opcional):
            <input
              type="text"
              value={valor}
              onChange={(e) => setValor(formatarValorInput(e.target.value))}
              placeholder="Ex: 50,00"
            />
            <small>Preço máximo: R$ {precoFormatado}</small>
          </label>

          {erro && <p className="erro">{erro}</p>}

          <button type="submit" disabled={loading}>
            {loading ? "Transferindo..." : "Transferir"}
          </button>

          <button type="button" onClick={onClose} className="btn-cancel">
            Cancelar
          </button>
        </form>
      </div>
    </div>
  );
}
