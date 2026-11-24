import { db } from "../../firebase-config";
import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  runTransaction,
  serverTimestamp,
  query,
  where,
} from "firebase/firestore";

const COLECAO = "comandas";

export const FORMAS_PAGAMENTO = [
  "Dinheiro",
  "PIX",
  "Cartão de crédito",
  "Cartão de débito",
  "Transferência",
  "Outro",
];

// ============================================================
// HELPERS (puros, também usados pelas telas)
// ============================================================

const arredondar = (n) => Math.round((Number(n) || 0) * 100) / 100;

const hojeISO = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate(),
  ).padStart(2, "0")}`;
};

export const sessoesRealizadas = (comanda, itemId) =>
  (comanda.baixas || []).filter((b) => b.itemId === itemId).length;

export const saldoItem = (comanda, item) =>
  Math.max(0, item.sessoesTotal - sessoesRealizadas(comanda, item.id));

export const saldoAPagar = (comanda) =>
  Math.max(0, arredondar((comanda.total || 0) - (comanda.valorPago || 0)));

export function calcularTotais(itens, desconto) {
  const subtotal = arredondar(
    itens.reduce((t, i) => t + i.valorUnitario * i.quantidade, 0),
  );

  let valorDesconto = 0;
  const valor = Math.max(0, Number(desconto?.valor) || 0);

  if (desconto?.tipo === "percentual") {
    valorDesconto = (subtotal * Math.min(valor, 100)) / 100;
  } else if (desconto?.tipo === "valor") {
    valorDesconto = Math.min(valor, subtotal);
  }

  valorDesconto = arredondar(valorDesconto);

  return {
    subtotal,
    valorDesconto,
    total: arredondar(subtotal - valorDesconto),
  };
}

// Valor de UMA sessão, já com o desconto da comanda aplicado proporcionalmente.
export function valorDaSessao(comanda, item) {
  const fator = comanda.subtotal > 0 ? comanda.total / comanda.subtotal : 1;
  return arredondar(
    (item.valorUnitario * item.quantidade * fator) / item.sessoesTotal,
  );
}

// Converte uma linha do formulário em item de comanda.
// Itens já salvos mantêm o preço do momento da venda (snapshot).
export function linhaParaItem(linha, servicos) {
  const quantidade = Math.floor(Number(linha.quantidade));
  if (!(quantidade >= 1)) return null;

  if (!linha.novo) {
    return {
      ...linha,
      quantidade,
      sessoesTotal: linha.sessoesPorUnidade * quantidade,
    };
  }

  const servico = servicos.find((s) => s.id === linha.servicoId);
  if (!servico) return null;

  const pacote = servico.tipo === "pacote";
  const porUnidade = pacote
    ? Math.max(1, Math.floor(Number(servico.sessoes)) || 1)
    : 1;

  return {
    id: linha.key,
    servicoId: servico.id,
    nome: servico.nome,
    tipo: pacote ? "pacote" : "servico",
    valorUnitario: Number(servico.valor) || 0,
    quantidade,
    sessoesPorUnidade: porUnidade,
    sessoesTotal: porUnidade * quantidade,
    servicosIncluidos: Array.isArray(servico.servicosIncluidos)
      ? servico.servicosIncluidos
      : [],
  };
}

// Fecha automaticamente quando todas as sessões foram realizadas E está pago.
function statusFinal(comanda) {
  const todasRealizadas = comanda.itens.every(
    (item) => sessoesRealizadas(comanda, item.id) >= item.sessoesTotal,
  );
  const pago = (comanda.valorPago || 0) >= (comanda.total || 0) - 0.005;

  return todasRealizadas && pago ? "fechada" : "aberta";
}

const validarDesconto = (desconto) => {
  if (!desconto) return null;

  const valor = Number(desconto.valor);

  if (!["valor", "percentual"].includes(desconto.tipo) || !(valor > 0)) {
    return null;
  }

  if (desconto.tipo === "percentual" && valor > 100) {
    throw new Error("O desconto percentual não pode passar de 100%.");
  }

  return { tipo: desconto.tipo, valor };
};

// ============================================================
// LEITURA
// ============================================================

export async function ReadAll() {
  const snapshot = await getDocs(collection(db, COLECAO));

  return snapshot.docs
    .map((item) => ({ id: item.id, ...item.data() }))
    .sort((a, b) => (b.numero || 0) - (a.numero || 0));
}

export async function Read(id) {
  const snapshot = await getDoc(doc(db, COLECAO, id));
  if (!snapshot.exists()) return null;
  return { id: snapshot.id, ...snapshot.data() };
}

// Comandas abertas de um cliente (usado pela Agenda para vincular).
// Filtra o status em memória para não exigir índice composto no Firestore.
export async function ReadAbertasDoCliente(clienteId) {
  if (!clienteId) return [];

  const snapshot = await getDocs(
    query(collection(db, COLECAO), where("clienteId", "==", clienteId)),
  );

  return snapshot.docs
    .map((item) => ({ id: item.id, ...item.data() }))
    .filter((c) => c.status === "aberta");
}

// ============================================================
// ESCRITA
// ============================================================

export async function Create({
  clienteId,
  clienteNome,
  itens,
  desconto,
  observacoes,
}) {
  if (!clienteId) throw new Error("Selecione um cliente.");
  if (!itens?.length) throw new Error("Adicione pelo menos um item à comanda.");

  const descontoValido = validarDesconto(desconto);
  const totais = calcularTotais(itens, descontoValido);

  const numero = await runTransaction(db, async (tx) => {
    const ref = doc(db, "contadores", "comandas");
    const snap = await tx.get(ref);
    const proximo = (snap.exists() ? snap.data().ultimo || 0 : 0) + 1;
    tx.set(ref, { ultimo: proximo });
    return proximo;
  });

  const dados = {
    numero,
    clienteId,
    clienteNome: String(clienteNome || "").trim(),
    itens,
    desconto: descontoValido,
    ...totais,
    baixas: [],
    pagamentos: [],
    valorPago: 0,
    formaPagamento: "",
    status: "aberta",
    observacoes: String(observacoes || "").trim(),
  };

  const ref = await addDoc(collection(db, COLECAO), {
    ...dados,
    criadoEm: serverTimestamp(),
    atualizadoEm: serverTimestamp(),
  });

  return { id: ref.id, ...dados };
}

// Altera itens/quantidades/desconto (inclui "adicionar sessões").
// Regras: não remove item com sessões realizadas e não reduz abaixo do já realizado.
export async function AtualizarItens(id, itens, desconto, observacoes = "") {
  if (!itens?.length)
    throw new Error("A comanda precisa ter pelo menos um item.");

  const descontoValido = validarDesconto(desconto);

  await runTransaction(db, async (tx) => {
    const ref = doc(db, COLECAO, id);
    const snap = await tx.get(ref);

    if (!snap.exists()) throw new Error("Comanda não encontrada.");

    const atual = { id, ...snap.data() };

    if (atual.status === "cancelada") {
      throw new Error("Comanda cancelada não pode ser alterada.");
    }

    for (const antigo of atual.itens) {
      const feitas = sessoesRealizadas(atual, antigo.id);
      const novo = itens.find((i) => i.id === antigo.id);

      if (!novo && feitas > 0) {
        throw new Error(
          `"${antigo.nome}" já tem sessões realizadas e não pode ser removido.`,
        );
      }

      if (novo && novo.sessoesTotal < feitas) {
        throw new Error(
          `"${antigo.nome}" já tem ${feitas} sessão(ões) realizada(s). A quantidade não pode ficar abaixo disso.`,
        );
      }
    }

    const totais = calcularTotais(itens, descontoValido);
    const novaComanda = {
      ...atual,
      itens,
      desconto: descontoValido,
      ...totais,
    };

    tx.update(ref, {
      itens,
      desconto: descontoValido,
      ...totais,
      observacoes: String(observacoes || "").trim(),
      status: statusFinal(novaComanda),
      atualizadoEm: serverTimestamp(),
    });
  });
}

// Pagamento é feito fora do sistema: aqui só registramos a forma e o valor.
export async function RegistrarPagamento(id, { forma, valor }) {
  if (!FORMAS_PAGAMENTO.includes(forma)) {
    throw new Error("Selecione a forma de pagamento.");
  }

  const valorPago = arredondar(valor);

  if (!(valorPago > 0)) throw new Error("Informe um valor maior que zero.");

  await runTransaction(db, async (tx) => {
    const ref = doc(db, COLECAO, id);
    const snap = await tx.get(ref);

    if (!snap.exists()) throw new Error("Comanda não encontrada.");

    const atual = { id, ...snap.data() };

    if (atual.status === "cancelada") {
      throw new Error("Comanda cancelada não aceita pagamento.");
    }

    const saldo = saldoAPagar(atual);

    if (saldo <= 0) throw new Error("Esta comanda já está paga.");
    if (valorPago > saldo + 0.005) {
      throw new Error("O valor informado é maior que o saldo a pagar.");
    }

    const pagamentos = [
      ...(atual.pagamentos || []),
      {
        id: `${Date.now()}`,
        forma,
        valor: valorPago,
        data: new Date().toISOString(),
      },
    ];

    const novoValorPago = arredondar(
      pagamentos.reduce((t, p) => t + p.valor, 0),
    );
    const novaComanda = { ...atual, pagamentos, valorPago: novoValorPago };

    tx.update(ref, {
      pagamentos,
      valorPago: novoValorPago,
      formaPagamento: forma,
      status: statusFinal(novaComanda),
      atualizadoEm: serverTimestamp(),
    });
  });
}

export async function Cancelar(id) {
  await runTransaction(db, async (tx) => {
    const ref = doc(db, COLECAO, id);
    const snap = await tx.get(ref);

    if (!snap.exists()) throw new Error("Comanda não encontrada.");

    const atual = snap.data();

    if ((atual.baixas || []).length > 0 || (atual.valorPago || 0) > 0) {
      throw new Error(
        "Esta comanda já tem sessões realizadas ou pagamento registrado e não pode ser cancelada.",
      );
    }

    tx.update(ref, { status: "cancelada", atualizadoEm: serverTimestamp() });
  });
}

// ============================================================
// BAIXA DE SESSÕES (o desconto do saldo acontece AQUI)
// ============================================================
//
// - Desconta `quantidade` sessões do item (1 por vez ou todas).
// - Se vier `agendamentoId`, marca o agendamento como "realizado".
// - Opcionalmente cria um RASCUNHO em `notasFiscais` (mesma tela que você já
//   tem, onde fica o botão "Confirmar Envio da Nota"). Não emite sozinho.
// - Tudo em transação: não existe baixa duplicada nem saldo negativo.

export async function DarBaixa(comandaId, itemId, quantidade = 1, opcoes = {}) {
  const { agendamentoId = null, gerarNota = true, data = hojeISO() } = opcoes;

  const qtd = Math.floor(Number(quantidade));
  if (!(qtd >= 1)) throw new Error("Quantidade inválida.");

  return runTransaction(db, async (tx) => {
    // ---------- leituras ----------
    const comandaRef = doc(db, COLECAO, comandaId);
    const comandaSnap = await tx.get(comandaRef);

    if (!comandaSnap.exists()) throw new Error("Comanda não encontrada.");

    const comanda = { id: comandaSnap.id, ...comandaSnap.data() };

    if (comanda.status === "cancelada") {
      throw new Error("Comanda cancelada não permite baixa de sessões.");
    }

    const item = comanda.itens.find((i) => i.id === itemId);
    if (!item) throw new Error("Item não encontrado na comanda.");

    const realizadasAntes = sessoesRealizadas(comanda, itemId);

    if (item.sessoesTotal - realizadasAntes < qtd) {
      throw new Error("Saldo de sessões insuficiente para esta baixa.");
    }

    let agendamentoRef = null;

    if (agendamentoId) {
      agendamentoRef = doc(db, "agendamentos", agendamentoId);
      const agSnap = await tx.get(agendamentoRef);

      if (!agSnap.exists()) throw new Error("Agendamento não encontrado.");
      if (agSnap.data().sessaoDescontada) {
        throw new Error("Este atendimento já foi confirmado anteriormente.");
      }
    }

    const valorSessao = valorDaSessao(comanda, item);
    const valorNota = arredondar(valorSessao * qtd);
    let cliente = {};

    const criarNota = gerarNota && valorNota > 0;

    if (criarNota) {
      const clienteSnap = await tx.get(doc(db, "clientes", comanda.clienteId));
      cliente = clienteSnap.exists() ? clienteSnap.data() : {};
    }

    // ---------- escritas ----------
    const novasBaixas = Array.from({ length: qtd }, (_, i) => ({
      id: `${Date.now()}-${i}`,
      itemId,
      data,
      agendamentoId: i === 0 ? agendamentoId : null,
      registradoEm: new Date().toISOString(),
    }));

    const baixas = [...(comanda.baixas || []), ...novasBaixas];
    const novaComanda = { ...comanda, baixas };

    tx.update(comandaRef, {
      baixas,
      status: statusFinal(novaComanda),
      atualizadoEm: serverTimestamp(),
    });

    if (agendamentoRef) {
      tx.update(agendamentoRef, {
        status: "realizado",
        sessaoDescontada: true,
        comandaId,
        comandaItemId: itemId,
        atualizadoEm: serverTimestamp(),
      });
    }

    if (criarNota) {
      const sufixo =
        item.tipo === "pacote"
          ? ` — sessão ${realizadasAntes + 1}${
              qtd > 1 ? ` a ${realizadasAntes + qtd}` : ""
            } de ${item.sessoesTotal}`
          : qtd > 1
            ? ` (${qtd}x)`
            : "";

      tx.set(doc(collection(db, "notasFiscais")), {
        clienteId: comanda.clienteId,
        clienteNome: comanda.clienteNome,
        clienteDocumento: cliente.cpfCnpj || cliente.cpf || cliente.cnpj || "",
        descricao: `${item.nome}${sufixo}`,
        valor: valorNota,
        dataCompetencia: data,
        observacoes: `Gerada pela comanda #${comanda.numero}`,
        status: "rascunho",
        tipo: "nfse",
        comandaId,
        ambiente: "nao_configurado",
        numeroNota: null,
        codigoVerificacao: null,
        protocolo: null,
        emitidaEm: null,
        criadoEm: serverTimestamp(),
        atualizadoEm: serverTimestamp(),
      });
    }

    return {
      sessoesRealizadas: realizadasAntes + qtd,
      sessoesTotal: item.sessoesTotal,
      notaCriada: criarNota,
    };
  });
}

// Usado pelo botão "Confirmar atendimento" do Dashboard.
// Agendamento ligado a uma comanda -> baixa de sessão + rascunho de nota.
// Agendamento sem comanda -> apenas marca como realizado (comportamento antigo).
export async function ConfirmarAtendimento(agendamento) {
  if (!agendamento?.id) throw new Error("Agendamento inválido.");

  if (agendamento.sessaoDescontada) {
    throw new Error("Este atendimento já foi confirmado.");
  }

  if (!agendamento.comandaId || !agendamento.comandaItemId) {
    await updateDoc(doc(db, "agendamentos", agendamento.id), {
      status: "realizado",
      sessaoDescontada: false,
      atualizadoEm: serverTimestamp(),
    });

    return { comMovimentoDeComanda: false };
  }

  const resultado = await DarBaixa(
    agendamento.comandaId,
    agendamento.comandaItemId,
    1,
    { agendamentoId: agendamento.id, data: agendamento.data || hojeISO() },
  );

  return { comMovimentoDeComanda: true, ...resultado };
}
