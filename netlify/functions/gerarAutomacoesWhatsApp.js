const admin = require("./firebaseAdmin");

const db = admin.firestore();
const FUSO_HORARIO = "America/Sao_Paulo";
const HORAS_ATE_FEEDBACK = 24;
const LIMITE_AGENDAMENTOS = 500;
const LIMITE_CLIENTES = 1000;

exports.config = {
  schedule: "*/15 * * * *",
};

function partesDataHora(date = new Date()) {
  const partes = new Intl.DateTimeFormat("en-CA", {
    timeZone: FUSO_HORARIO,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);

  return Object.fromEntries(
    partes
      .filter((parte) => parte.type !== "literal")
      .map((parte) => [parte.type, parte.value]),
  );
}

function dataLocalISO(date = new Date()) {
  const p = partesDataHora(date);
  return `${p.year}-${p.month}-${p.day}`;
}

function converterDataNascimento(valor) {
  if (!valor) return null;

  if (typeof valor?.toDate === "function") {
    const data = valor.toDate();
    return {
      mes: String(data.getUTCMonth() + 1).padStart(2, "0"),
      dia: String(data.getUTCDate()).padStart(2, "0"),
    };
  }

  if (valor instanceof Date && !Number.isNaN(valor.getTime())) {
    return {
      mes: String(valor.getUTCMonth() + 1).padStart(2, "0"),
      dia: String(valor.getUTCDate()).padStart(2, "0"),
    };
  }

  const texto = String(valor).trim();
  let ano, mes, dia;

  let match = texto.match(/^(\d{4})-(\d{2})-(\d{2})/);

  if (match) {
    [, ano, mes, dia] = match;
  } else {
    match = texto.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);

    if (match) {
      [, dia, mes, ano] = match;
    } else {
      return null;
    }
  }

  const m = Number(mes);
  const d = Number(dia);

  if (m < 1 || m > 12 || d < 1 || d > 31) return null;

  return {
    mes: String(m).padStart(2, "0"),
    dia: String(d).padStart(2, "0"),
  };
}

function converterDataHoraAgendamento(data, horario) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(data || ""))) {
    return null;
  }

  const horaMatch = String(horario || "").match(/^(\d{1,2}):(\d{2})/);

  if (!horaMatch) return null;

  const hora = Number(horaMatch[1]);
  const minuto = Number(horaMatch[2]);

  if (hora > 23 || minuto > 59) return null;

  // A data e o horário do sistema são interpretados no horário de Brasília.
  return new Date(
    `${data}T${String(hora).padStart(2, "0")}:${String(minuto).padStart(2, "0")}:00-03:00`,
  );
}

async function criarNotificacaoUnica(id, dados) {
  const referencia = db.collection("notificacoes").doc(id);

  try {
    await referencia.create({
      ...dados,
      status: "pendente",
      tentativas: 0,
      criadoEm: admin.firestore.FieldValue.serverTimestamp(),
      atualizadoEm: admin.firestore.FieldValue.serverTimestamp(),
    });

    return "criada";
  } catch (error) {
    if (error.code === 6 || error.code === "already-exists") {
      return "existente";
    }

    throw error;
  }
}

async function gerarFeedback(agora) {
  const snapshot = await db
    .collection("agendamentos")
    .where("status", "==", "concluido")
    .limit(LIMITE_AGENDAMENTOS)
    .get();

  let criadas = 0;
  let existentes = 0;
  let ignoradas = 0;

  for (const item of snapshot.docs) {
    const agendamento = item.data();

    const horarioFinal =
      agendamento.horarioFim || agendamento.horarioFinal || agendamento.horario;

    const fim = converterDataHoraAgendamento(agendamento.data, horarioFinal);

    if (!fim) {
      ignoradas++;
      console.warn("Agendamento sem data/horário válido para feedback:", {
        agendamentoId: item.id,
      });
      continue;
    }

    const liberacao = new Date(
      fim.getTime() + HORAS_ATE_FEEDBACK * 60 * 60 * 1000,
    );

    if (agora < liberacao) continue;

    if (!agendamento.clienteId) {
      ignoradas++;
      console.warn("Agendamento sem clienteId:", {
        agendamentoId: item.id,
      });
      continue;
    }

    const resultado = await criarNotificacaoUnica(`feedback_${item.id}`, {
      tipo: "feedback",
      agendamentoId: item.id,
      clienteId: String(agendamento.clienteId),
    });

    if (resultado === "criada") criadas++;
    else existentes++;
  }

  return { criadas, existentes, ignoradas };
}

async function gerarAniversarios(agora) {
  const hoje = dataLocalISO(agora);
  const [, mes, dia] = hoje.split("-");
  const ano = hoje.slice(0, 4);

  const snapshot = await db.collection("clientes").limit(LIMITE_CLIENTES).get();

  let criadas = 0;
  let existentes = 0;
  let semNascimento = 0;

  for (const item of snapshot.docs) {
    const cliente = item.data();
    const nascimento = converterDataNascimento(cliente.dataNascimento);

    if (!nascimento) {
      semNascimento++;
      continue;
    }

    if (nascimento.mes !== mes || nascimento.dia !== dia) continue;

    const resultado = await criarNotificacaoUnica(
      `aniversario_${item.id}_${ano}`,
      {
        tipo: "aniversario",
        clienteId: item.id,
        anoReferencia: Number(ano),
      },
    );

    if (resultado === "criada") criadas++;
    else existentes++;
  }

  return { criadas, existentes, semNascimento };
}

exports.handler = async () => {
  try {
    const agora = new Date();

    const [feedback, aniversarios] = await Promise.all([
      gerarFeedback(agora),
      gerarAniversarios(agora),
    ]);

    const resultado = {
      executadoEm: agora.toISOString(),
      feedback,
      aniversarios,
    };

    console.log("Resumo da geração de automações WhatsApp:", resultado);

    return {
      statusCode: 200,
      body: JSON.stringify(resultado),
    };
  } catch (error) {
    console.error("Erro ao gerar automações WhatsApp:", error);

    return {
      statusCode: 500,
      body: JSON.stringify({
        erro: "Não foi possível gerar as automações WhatsApp.",
      }),
    };
  }
};
