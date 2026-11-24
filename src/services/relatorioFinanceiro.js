import { FAIXAS_ETARIAS, SEM_IDADE, faixaEtaria, calcularIdade } from "./idade";

// Regras (combinadas com a cliente):
// - Faturamento = valor PAGO registrado nas comandas, no período do pagamento.
//   Cada pagamento é dividido entre "serviços" e "pacotes" na proporção dos
//   itens da comanda (o desconto já está embutido no valor pago).
// - Atendimentos antigos, realizados SEM comanda, entram como serviço pelo
//   valor do agendamento.
// - Serviços realizados = baixas de sessão no período + atendimentos antigos
//   sem comanda.
// - Ticket médio = total movimentado ÷ serviços realizados.

const arredondar = (n) => Math.round((Number(n) || 0) * 100) / 100;

const dataLocal = (iso) => {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";

  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate(),
  ).padStart(2, "0")}`;
};

const itemCombina = (item, filtroServico) =>
  filtroServico === "todos" ||
  item.servicoId === filtroServico ||
  (item.servicosIncluidos || []).includes(filtroServico);

export function calcularRelatorio({
  comandas = [],
  agendamentos = [],
  clientes = [],
  dataInicio = "",
  dataFim = "",
  filtroServico = "todos",
}) {
  const noPeriodo = (data) =>
    Boolean(data) &&
    (!dataInicio || data >= dataInicio) &&
    (!dataFim || data <= dataFim);

  const mapaClientes = new Map(clientes.map((c) => [c.id, c]));
  const porCliente = new Map();

  const obterCliente = (id, nomeFallback) => {
    const chave = id || "sem-cliente";

    if (!porCliente.has(chave)) {
      const cadastro = mapaClientes.get(id);

      porCliente.set(chave, {
        id: chave,
        nome: cadastro?.nome || nomeFallback || "Cliente não informado",
        dataNascimento: cadastro?.dataNascimento || "",
        servicos: 0,
        movimentado: 0,
      });
    }

    return porCliente.get(chave);
  };

  let faturamentoServicos = 0;
  let faturamentoPacotes = 0;

  // ---------- Comandas ----------
  comandas
    .filter((c) => c.status !== "cancelada")
    .forEach((comanda) => {
      const subtotal = Number(comanda.subtotal) || 0;

      // Pagamentos
      (comanda.pagamentos || []).forEach((pagamento) => {
        if (!noPeriodo(dataLocal(pagamento.data)) || subtotal <= 0) return;

        (comanda.itens || []).forEach((item) => {
          if (!itemCombina(item, filtroServico)) return;

          const peso = (item.valorUnitario * item.quantidade) / subtotal;
          const valor = pagamento.valor * peso;

          if (item.tipo === "pacote") faturamentoPacotes += valor;
          else faturamentoServicos += valor;

          obterCliente(comanda.clienteId, comanda.clienteNome).movimentado +=
            valor;
        });
      });

      // Sessões realizadas
      (comanda.baixas || []).forEach((baixa) => {
        if (!noPeriodo(baixa.data)) return;

        const item = (comanda.itens || []).find((i) => i.id === baixa.itemId);
        if (!item || !itemCombina(item, filtroServico)) return;

        obterCliente(comanda.clienteId, comanda.clienteNome).servicos += 1;
      });
    });

  // ---------- Atendimentos antigos (sem comanda) ----------
  agendamentos.forEach((ag) => {
    if (ag.status !== "realizado" || ag.comandaId) return;
    if (!noPeriodo(ag.data)) return;
    if (filtroServico !== "todos" && ag.servicoId !== filtroServico) return;

    const valor = Number(ag.valor) || 0;

    faturamentoServicos += valor;

    const cliente = obterCliente(ag.clienteId, ag.clienteNome);
    cliente.servicos += 1;
    cliente.movimentado += valor;
  });

  // ---------- Ranking de clientes ----------
  const ranking = Array.from(porCliente.values())
    .filter((c) => c.servicos > 0 || c.movimentado > 0)
    .map((c) => ({
      ...c,
      movimentado: arredondar(c.movimentado),
      idade: calcularIdade(c.dataNascimento),
      ticketMedio: c.servicos > 0 ? arredondar(c.movimentado / c.servicos) : 0,
    }))
    .sort((a, b) => b.servicos - a.servicos || b.movimentado - a.movimentado);

  // ---------- Faixas etárias ----------
  const faixas = [...FAIXAS_ETARIAS, SEM_IDADE].map((faixa) => ({
    id: faixa.id,
    label: faixa.label,
    clientes: 0,
    servicos: 0,
    movimentado: 0,
  }));

  ranking.forEach((c) => {
    const faixa = faixas.find((f) => f.id === faixaEtaria(c.dataNascimento).id);
    if (!faixa) return;

    faixa.clientes += 1;
    faixa.servicos += c.servicos;
    faixa.movimentado += c.movimentado;
  });

  faixas.forEach((f) => {
    f.movimentado = arredondar(f.movimentado);
    f.ticketMedio = f.servicos > 0 ? arredondar(f.movimentado / f.servicos) : 0;
  });

  // ---------- Totais ----------
  const servicos = arredondar(faturamentoServicos);
  const pacotes = arredondar(faturamentoPacotes);
  const total = arredondar(servicos + pacotes);
  const totalServicosRealizados = ranking.reduce((t, c) => t + c.servicos, 0);

  return {
    faturamento: { servicos, pacotes, total },
    porTipo: [
      { id: "servicos", label: "Serviços", valor: servicos, cor: "#8B5CF6" },
      { id: "pacotes", label: "Pacotes", valor: pacotes, cor: "#EC4899" },
    ],
    clientes: ranking,
    faixas,
    totalServicosRealizados,
    ticketMedioGeral:
      totalServicosRealizados > 0
        ? arredondar(total / totalServicosRealizados)
        : 0,
  };
}
