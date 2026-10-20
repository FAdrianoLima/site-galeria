const axios = require("axios");

function normalizarTelefone(valor, ddd = "") {
  let numero = String(valor || "").replace(/\D/g, "");
  const codigoArea = String(ddd || "").replace(/\D/g, "");

  if (!numero) return null;

  if ((numero.length === 8 || numero.length === 9) && codigoArea) {
    numero = codigoArea + numero;
  }

  if (numero.length === 10 || numero.length === 11) {
    numero = `55${numero}`;
  }

  if (!/^55\d{10,11}$/.test(numero)) {
    return null;
  }

  return numero;
}

async function enviarTextoWhatsApp(telefone, mensagem) {
  const instanceId = process.env.ZAPI_INSTANCE_ID;
  const token = process.env.ZAPI_TOKEN;
  const clientToken = process.env.ZAPI_CLIENT_TOKEN;

  if (!instanceId || !token || !clientToken) {
    throw new Error("Configuração da Z-API incompleta.");
  }

  if (!telefone || !/^55\d{10,11}$/.test(String(telefone))) {
    throw new Error("Número de WhatsApp inválido.");
  }

  if (!mensagem || !String(mensagem).trim()) {
    throw new Error("A mensagem não pode estar vazia.");
  }

  const url =
    `https://api.z-api.io/instances/${encodeURIComponent(instanceId)}` +
    `/token/${encodeURIComponent(token)}/send-text`;

  try {
    const resposta = await axios.post(
      url,
      {
        phone: telefone,
        message: mensagem,
      },
      {
        timeout: 20000,
        headers: {
          "Client-Token": clientToken,
          "Content-Type": "application/json",
        },
      },
    );

    return resposta.data;
  } catch (error) {
    const status = error.response?.status;
    const detalhe = error.response?.data;

    console.error("Erro da Z-API:", {
      status: status || null,
      detalhe: detalhe || error.message,
    });

    throw new Error(
      status
        ? `A Z-API retornou HTTP ${status}. Consulte o log do Netlify Dev.`
        : `Falha na conexão com a Z-API: ${error.message}`,
    );
  }
}

module.exports = {
  normalizarTelefone,
  enviarTextoWhatsApp,
};
