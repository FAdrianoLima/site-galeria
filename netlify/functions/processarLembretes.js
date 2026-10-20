const admin = require("./firebaseAdmin");

const db = admin.firestore();

exports.config = {
  schedule: "*/15 * * * *",
};

function dataLocalSP(data = new Date()) {
  const partes = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(data);

  const valores = Object.fromEntries(
    partes.map((parte) => [parte.type, parte.value]),
  );

  return `${valores.year}-${valores.month}-${valores.day}`;
}

function adicionarDias(dataISO, quantidade) {
  const [ano, mes, dia] = dataISO.split("-").map(Number);
  const data = new Date(Date.UTC(ano, mes - 1, dia + quantidade));

  return [
    data.getUTCFullYear(),
    String(data.getUTCMonth() + 1).padStart(2, "0"),
    String(data.getUTCDate()).padStart(2, "0"),
  ].join("-");
}

function horarioDoAgendamento(data, horario) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(data || ""))) {
    return null;
  }

  if (!/^\d{2}:\d{2}$/.test(String(horario || ""))) {
    return null;
  }

  // Horário local de Brasília. O Brasil não adota horário de verão
  // atualmente; revise este ponto se a regra de fuso mudar.
  const timestamp = new Date(`${data}T${horario}:00-03:00`).getTime();

  return Number.isFinite(timestamp) ? timestamp : null;
}

exports.handler = async () => {
  try {
    const agora = Date.now();

    // Janela que tolera pequenos atrasos na execução agendada.
    const inicioJanela = agora + (23 * 60 + 30) * 60 * 1000;
    const fimJanela = agora + 24 * 60 * 60 * 1000 + 15 * 60 * 1000;

    const hoje = dataLocalSP();
    const limiteData = adicionarDias(hoje, 2);

    const snapshot = await db
      .collection("agendamentos")
      .where("data", ">=", hoje)
      .where("data", "<=", limiteData)
      .get();

    let criados = 0;
    let existentes = 0;

    for (const item of snapshot.docs) {
      const agendamento = item.data();
      const status = String(agendamento.status || "").toLowerCase();

      if (!["agendado", "confirmado"].includes(status)) continue;

      const horario = horarioDoAgendamento(
        agendamento.data,
        agendamento.horario,
      );

      if (horario === null || horario < inicioJanela || horario > fimJanela) {
        continue;
      }

      const idNotificacao =
        `lembrete_${item.id}_${agendamento.data}_${agendamento.horario}`.replace(
          /[^a-zA-Z0-9_-]/g,
          "_",
        );

      const referencia = db.collection("notificacoes").doc(idNotificacao);

      try {
        await referencia.create({
          tipo: "lembrete",
          agendamentoId: item.id,
          status: "pendente",
          tentativas: 0,
          criadoEm: admin.firestore.FieldValue.serverTimestamp(),
          atualizadoEm: admin.firestore.FieldValue.serverTimestamp(),
        });

        criados++;
      } catch (error) {
        // ALREADY_EXISTS: este lembrete já foi criado.
        if (error.code === 6 || error.code === "already-exists") {
          existentes++;
          continue;
        }

        throw error;
      }
    }

    return {
      statusCode: 200,
      body: JSON.stringify({
        criados,
        existentes,
      }),
    };
  } catch (error) {
    console.error("Erro ao gerar lembretes:", error.message);

    return {
      statusCode: 500,
      body: JSON.stringify({
        erro: "Não foi possível gerar os lembretes.",
      }),
    };
  }
};
