import { db } from "../../firebase-config";
import {
  collection,
  addDoc,
  getDocs,
  getDoc,
  doc,
  updateDoc,
  serverTimestamp,
  writeBatch,
} from "firebase/firestore";

const COLECAO = "agendamentos";

const STATUS_VALIDOS = [
  "agendado",
  "confirmado",
  "realizado",
  "cancelado",
  "faltou",
];

const minutosDoHorario = (horario) => {
  const [hora, minuto] = String(horario || "")
    .split(":")
    .map(Number);

  if (
    !Number.isInteger(hora) ||
    !Number.isInteger(minuto) ||
    hora < 0 ||
    hora > 23 ||
    minuto < 0 ||
    minuto > 59
  ) {
    return null;
  }

  return hora * 60 + minuto;
};

const horarioDeMinutos = (minutos) => {
  const hora = Math.floor(minutos / 60);
  const minuto = minutos % 60;

  return `${String(hora).padStart(2, "0")}:${String(minuto).padStart(2, "0")}`;
};

const normalizarDados = (dados) => {
  const data = String(dados.data || "").trim();
  const horario = String(dados.horario || "").trim();
  const duracao = Number(dados.duracao);
  const inicio = minutosDoHorario(horario);

  if (!dados.clienteId) {
    throw new Error("Selecione um cliente.");
  }

  if (!dados.servicoId) {
    throw new Error("Selecione um serviço.");
  }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(data)) {
    throw new Error("Informe uma data válida.");
  }

  const dataValidada = new Date(`${data}T12:00:00`);

  if (
    Number.isNaN(dataValidada.getTime()) ||
    dataValidada.toISOString().slice(0, 10) !== data
  ) {
    throw new Error("A data informada não é válida.");
  }

  if (inicio === null) {
    throw new Error("Informe um horário válido.");
  }

  if (!Number.isInteger(duracao) || duracao <= 0) {
    throw new Error("A duração deve ser um número inteiro maior que zero.");
  }

  const fim = inicio + duracao;

  if (fim > 24 * 60) {
    throw new Error("O agendamento não pode ultrapassar a meia-noite.");
  }

  const status = String(dados.status || "agendado").toLowerCase();

  if (!STATUS_VALIDOS.includes(status)) {
    throw new Error("O status informado não é válido.");
  }

  return {
    data,
    horario,
    horarioFim: horarioDeMinutos(fim),
    clienteId: dados.clienteId,
    clienteNome: String(dados.clienteNome || "").trim(),
    servicoId: dados.servicoId,
    servicoNome: String(dados.servicoNome || "").trim(),
    duracao,
    valor: Number(dados.valor) || 0,
    status,
    observacoes: String(dados.observacoes || "").trim(),
  };
};

export async function ReadAll() {
  const snapshot = await getDocs(collection(db, COLECAO));

  return snapshot.docs
    .map((item) => ({
      id: item.id,
      ...item.data(),
    }))
    .sort((a, b) => {
      const porData = String(a.data || "").localeCompare(String(b.data || ""));
      if (porData !== 0) return porData;

      return String(a.horario || "").localeCompare(String(b.horario || ""));
    });
}

export async function Create(dados) {
  const agendamento = normalizarDados(dados);
  const referencia = doc(collection(db, COLECAO));
  const batch = writeBatch(db);

  batch.set(referencia, {
    ...agendamento,
    criadoEm: serverTimestamp(),
    atualizadoEm: serverTimestamp(),
  });

  if (agendamento.status === "confirmado") {
    registrarNotificacao(batch, "confirmacao", referencia.id);
  } else if (agendamento.status === "agendado") {
    registrarNotificacao(batch, "novo_agendamento", referencia.id);
  }

  const snapshot = await getDocs(collection(db, COLECAO));
  const existentes = snapshot.docs.map((item) => ({
    id: item.id,
    ...item.data(),
  }));

  validarConflito(agendamento, existentes);

  await batch.commit();

  return {
    id: referencia.id,
    ...agendamento,
  };
}

export async function Update(id, dados) {
  if (!id) throw new Error("ID do agendamento não informado.");

  const agendamento = normalizarDados(dados);

  const snapshot = await getDocs(collection(db, COLECAO));
  const existentes = snapshot.docs
    .filter((item) => item.id !== id)
    .map((item) => ({
      id: item.id,
      ...item.data(),
    }));

  validarConflito(agendamento, existentes);

  await updateDoc(doc(db, COLECAO, id), {
    ...agendamento,
    atualizadoEm: serverTimestamp(),
  });

  return {
    id,
    ...agendamento,
  };
}

export async function Cancelar(id) {
  if (!id) throw new Error("ID do agendamento não informado.");

  await updateDoc(doc(db, COLECAO, id), {
    status: "cancelado",
    atualizadoEm: serverTimestamp(),
  });

  return true;
}

function validarConflito(novo, existentes) {
  if (novo.status === "cancelado") return;

  const novoInicio = minutosDoHorario(novo.horario);
  const novoFim = novoInicio + novo.duracao;

  const conflito = existentes.find((item) => {
    if (item.data !== novo.data) return false;

    if (
      ["cancelado", "faltou"].includes(String(item.status || "").toLowerCase())
    ) {
      return false;
    }

    const inicio = minutosDoHorario(item.horario);
    if (inicio === null) return false;

    const duracaoExistente = Number(item.duracao) || 0;
    const fim = inicio + duracaoExistente;

    // Impede sobreposição de horários para a mesma agenda.
    return novoInicio < fim && novoFim > inicio;
  });

  if (conflito) {
    throw new Error(
      `Conflito de horário: já existe um agendamento às ${conflito.horario} para esse período.`,
    );
  }
}

function registrarNotificacao(batch, tipo, agendamentoId) {
  const referencia = doc(collection(db, "notificacoes"));

  batch.set(referencia, {
    tipo,
    agendamentoId,
    status: "pendente",
    tentativas: 0,
    criadoEm: serverTimestamp(),
    atualizadoEm: serverTimestamp(),
  });
}
