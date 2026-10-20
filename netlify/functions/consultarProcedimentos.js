const admin = require("./firebaseAdmin");

const db = admin.firestore();

function normalizarCPF(valor) {
  return String(valor || "").replace(/\D/g, "");
}

exports.handler = async (event) => {
  const headers = {
    "Content-Type": "application/json",
    "Cache-Control": "no-store",
  };

  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ erro: "Método não permitido." }),
    };
  }

  try {
    const body = JSON.parse(event.body || "{}");
    const cpf = normalizarCPF(body.cpf);

    if (cpf.length !== 11) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ erro: "Informe um CPF válido." }),
      };
    }

    // A consulta usa os campos conhecidos do cadastro.
    // Se o projeto armazena CPF com máscara, consultamos os dois formatos.
    const cpfFormatado = cpf.replace(
      /^(\d{3})(\d{3})(\d{3})(\d{2})$/,
      "$1.$2.$3-$4",
    );

    const clientesRef = db.collection("clientes");

    const [resultadoSemMascara, resultadoComMascara] = await Promise.all([
      clientesRef.where("cpfCnpj", "==", cpf).limit(2).get(),
      clientesRef.where("cpfCnpj", "==", cpfFormatado).limit(2).get(),
    ]);

    const encontrados = new Map();

    for (const doc of [
      ...resultadoSemMascara.docs,
      ...resultadoComMascara.docs,
    ]) {
      encontrados.set(doc.id, doc);
    }

    if (encontrados.size !== 1) {
      // Resposta genérica para não revelar se um CPF está cadastrado.
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({
          erro: "Não foi possível localizar o cadastro. Confira os dados ou entre em contato com a Galeria da Beleza.",
        }),
      };
    }

    const clienteDoc = [...encontrados.values()][0];
    const cliente = clienteDoc.data();

    const agendamentosSnap = await db
      .collection("agendamentos")
      .where("clienteId", "==", clienteDoc.id)
      .get();

    const agora = new Date();

    const procedimentos = agendamentosSnap.docs.map((doc) => {
      const item = doc.data();

      return {
        id: doc.id,
        data: String(item.data || ""),
        horario: String(item.horario || ""),
        servicoNome: String(item.servicoNome || "Atendimento"),
        status: String(item.status || "agendado").toLowerCase(),
      };
    });

    procedimentos.sort((a, b) => {
      const dataA = `${a.data} ${a.horario}`;
      const dataB = `${b.data} ${b.horario}`;
      return dataA.localeCompare(dataB);
    });

    const futuros = procedimentos.filter((item) => {
      const dataHora = new Date(
        `${item.data}T${item.horario || "00:00"}:00-03:00`,
      );

      return (
        !Number.isNaN(dataHora.getTime()) &&
        dataHora >= agora &&
        ["agendado", "confirmado"].includes(item.status)
      );
    });

    const historico = procedimentos.filter((item) =>
      ["concluido", "cancelado"].includes(item.status),
    );

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        cliente: {
          nome: String(cliente.nome || cliente.nomeFantasia || ""),
        },
        futuros,
        historico,
      }),
    };
  } catch (error) {
    console.error("Erro ao consultar procedimentos:", error.message);

    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        erro: "Não foi possível consultar os procedimentos agora.",
      }),
    };
  }
};
