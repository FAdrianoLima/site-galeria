const crypto = require("crypto");
const { normalizarTelefone, enviarTextoWhatsApp } = require("./_whatsapp");

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      body: JSON.stringify({ erro: "Método não permitido." }),
    };
  }

  const segredo = process.env.WHATSAPP_TEST_SECRET;
  const fornecido =
    event.headers?.["x-test-secret"] || event.headers?.["X-Test-Secret"] || "";

  if (!segredo || !fornecido) {
    return {
      statusCode: 401,
      body: JSON.stringify({ erro: "Não autorizado." }),
    };
  }

  const segredoBuffer = Buffer.from(segredo);
  const fornecidoBuffer = Buffer.from(fornecido);

  if (
    segredoBuffer.length !== fornecidoBuffer.length ||
    !crypto.timingSafeEqual(segredoBuffer, fornecidoBuffer)
  ) {
    return {
      statusCode: 401,
      body: JSON.stringify({ erro: "Não autorizado." }),
    };
  }

  try {
    const telefone = normalizarTelefone(process.env.ZAPI_TEST_PHONE);

    if (!telefone) {
      throw new Error("ZAPI_TEST_PHONE não está configurado corretamente.");
    }

    const resposta = await enviarTextoWhatsApp(
      telefone,
      "Teste de integração da Galeria da Beleza. Se você recebeu esta mensagem, o envio pela Z-API está funcionando.",
    );

    return {
      statusCode: 200,
      body: JSON.stringify({
        sucesso: true,
        mensagem: "A solicitação de envio foi aceita pela Z-API.",
        respostaApi: resposta || null,
      }),
    };
  } catch (error) {
    console.error("Falha no teste de WhatsApp:", error.message);

    return {
      statusCode: 500,
      body: JSON.stringify({
        sucesso: false,
        erro: "Não foi possível enviar o teste.",
      }),
    };
  }
};
