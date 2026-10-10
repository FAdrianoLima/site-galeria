const admin = require("./firebaseAdmin");
const { normalizarTelefone, enviarTextoWhatsApp } = require("./_whatsapp");

const db = admin.firestore();
const LIMITE = 50;
const MAX_TENTATIVAS = 5;
const TEMPO_TRAVA_MS = 15 * 60 * 1000;

exports.config = {
  schedule: "*/5 * * * *",
};

function formatarData(data) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(data || ""))) {
    return data || "não informada";
  }

  const [ano, mes, dia] = data.split("-");
  return `${dia}/${mes}/${ano}`;
}

function criarMensagem(tipo, agendamento) {
  const data = formatarData(agendamento.data);
  const horario = agendamento.horario || "";
  const servico = agendamento.servicoNome || "seu atendimento";
  const nome = agendamento.clienteNome || "Olá";

  switch (tipo) {
    case "novo_agendamento":
      return (
        `Olá, ${nome}! 💗\n\n` +
        `Seu atendimento na Galeria da Beleza foi agendado.\n\n` +
        `Serviço: ${servico}\n` +
        `Data: ${data}\n` +
        `Horário: ${horario}\n\n` +
        `Se precisar de alguma alteração, entre em contato conosco.`
      );

    case "confirmacao":
      return (
        `Olá, ${nome}! 💗\n\n` +
        `Seu atendimento na Galeria da Beleza está confirmado!\n\n` +
        `Serviço: ${servico}\n` +
        `Data: ${data}\n` +
        `Horário: ${horario}\n\n` +
        `Aguardamos você!`
      );

    case "alteracao":
      return (
        `Olá, ${nome}! 💗\n\n` +
        `Houve uma atualização no seu atendimento na Galeria da Beleza.\n\n` +
        `Serviço: ${servico}\n` +
        `Data: ${data}\n` +
        `Horário: ${horario}\n\n` +
        `Em caso de dúvidas, entre em contato conosco.`
      );

    case "cancelamento":
      return (
        `Olá, ${nome}.\n\n` +
        `Seu atendimento na Galeria da Beleza, previsto para ${data} ` +
        `às ${horario}, foi cancelado.\n\n` +
        `Se desejar agendar novamente, entre em contato conosco.`
      );

    case "lembrete":
      return (
        `Olá, ${nome}! 💗\n\n` +
        `Este é um lembrete do seu atendimento na Galeria da Beleza.\n\n` +
        `Serviço: ${servico}\n` +
        `Data: ${data}\n` +
        `Horário: ${horario}\n\n` +
        `Esperamos você!`
      );

    default:
      throw new Error(`Tipo de notificação desconhecido: ${tipo}`);
  }
}

function notificacaoAindaValida(tipo, agendamento) {
  const status = String(agendamento.status || "").toLowerCase();

  if (tipo === "cancelamento") {
    return status === "cancelado";
  }

  if (tipo === "confirmacao") {
    return status === "confirmado";
  }

  if (tipo === "novo_agendamento" || tipo === "alteracao") {
    return ["agendado", "confirmado"].includes(status);
  }

  if (tipo === "lembrete") {
    return ["agendado", "confirmado"].includes(status);
  }

  return false;
}

function erroPodeSerReprocessado(notificacao) {
  const tentativas = Number(notificacao.tentativas || 0);
  return tentativas < MAX_TENTATIVAS;
}

async function processarUmaNotificacao(referencia, agora) {
  const dbAgora = admin.firestore.Timestamp.fromDate(agora);
  const snap = await referencia.get();

  if (!snap.exists) return "ignorada";

  const notificacao = snap.data();

  if (notificacao.status === "enviada" || notificacao.status === "ignorada") {
    return "ignorada";
  }

  const emProcessamento =
    notificacao.status === "processando" &&
    notificacao.processandoEm &&
    agora.getTime() - notificacao.processandoEm.toDate().getTime() <
      TEMPO_TRAVA_MS;

  if (emProcessamento) return "ignorada";

  if (notificacao.status === "erro" && !erroPodeSerReprocessado(notificacao)) {
    return "ignorada";
  }

  // A trava reduz a chance de dois processadores enviarem a mesma mensagem.
  await referencia.update({
    status: "processando",
    processandoEm: dbAgora,
    atualizadoEm: dbAgora,
  });

  try {
    const agendamentoId = notificacao.agendamentoId;
    const agendamentoRef = db.collection("agendamentos").doc(agendamentoId);
    const agendamentoSnap = await agendamentoRef.get();

    if (!agendamentoSnap.exists) {
      await referencia.update({
        status: "ignorada",
        motivo: "Agendamento não encontrado.",
        atualizadoEm: admin.firestore.FieldValue.serverTimestamp(),
      });
      return "ignorada";
    }

    const agendamento = agendamentoSnap.data();

    if (!notificacaoAindaValida(notificacao.tipo, agendamento)) {
      await referencia.update({
        status: "ignorada",
        motivo: "O estado atual do agendamento não corresponde à notificação.",
        atualizadoEm: admin.firestore.FieldValue.serverTimestamp(),
      });
      return "ignorada";
    }

    const clienteSnap = await db
      .collection("clientes")
      .doc(agendamento.clienteId)
      .get();

    if (!clienteSnap.exists) {
      throw new Error("Cliente não encontrado.");
    }

    const cliente = clienteSnap.data();

    const telefone = normalizarTelefone(
      cliente.whatsapp || cliente.telefone || cliente.celular,
      cliente.ddd,
    );

    if (!telefone) {
      throw new Error("Cliente sem telefone válido para WhatsApp.");
    }

    const dadosMensagem = {
      ...agendamento,
      clienteNome:
        cliente.nome ||
        cliente.nomeFantasia ||
        agendamento.clienteNome ||
        "Olá",
    };

    const mensagem = criarMensagem(notificacao.tipo, dadosMensagem);

    const resposta = await enviarTextoWhatsApp(telefone, mensagem);

    await referencia.update({
      status: "enviada",
      telefoneDestino: telefone,
      mensagem,
      respostaApi: resposta || null,
      enviadaEm: admin.firestore.FieldValue.serverTimestamp(),
      atualizadoEm: admin.firestore.FieldValue.serverTimestamp(),
      erro: admin.firestore.FieldValue.delete(),
    });

    return "enviada";
  } catch (error) {
    const atual = await referencia.get();
    const tentativas = Number(atual.data()?.tentativas || 0) + 1;

    await referencia.update({
      status: tentativas >= MAX_TENTATIVAS ? "erro" : "pendente",
      tentativas,
      erro: String(error.message || "Erro desconhecido").slice(0, 1000),
      ultimaTentativaEm: admin.firestore.FieldValue.serverTimestamp(),
      atualizadoEm: admin.firestore.FieldValue.serverTimestamp(),
    });

    console.error("Falha ao processar notificação:", {
      notificacaoId: referencia.id,
      tentativas,
      erro: error.message,
    });

    return "erro";
  }
}

exports.handler = async () => {
  try {
    const snapshot = await db
      .collection("notificacoes")
      .where("status", "in", ["pendente", "processando", "erro"])
      .limit(LIMITE)
      .get();

    const resultado = {
      processadas: 0,
      enviadas: 0,
      erros: 0,
      ignoradas: 0,
    };

    for (const item of snapshot.docs) {
      const status = await processarUmaNotificacao(item.ref, new Date());

      resultado.processadas++;

      if (status === "enviada") resultado.enviadas++;
      else if (status === "erro") resultado.erros++;
      else resultado.ignoradas++;
    }

    return {
      statusCode: 200,
      body: JSON.stringify(resultado),
    };
  } catch (error) {
    console.error("Erro geral no processador:", error.message);

    return {
      statusCode: 500,
      body: JSON.stringify({
        erro: "Não foi possível processar as notificações.",
      }),
    };
  }
};
