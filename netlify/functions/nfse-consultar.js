const admin = require("./firebaseAdmin");

const headers = {
  "Content-Type": "application/json",
  "Cache-Control": "no-store",
};

function resposta(statusCode, dados) {
  return {
    statusCode,
    headers,
    body: JSON.stringify(dados),
  };
}

exports.handler = async (event) => {
  if (event.httpMethod !== "GET") {
    return resposta(405, { erro: "Método não permitido." });
  }

  try {
    // Autenticação Firebase
    const authorization =
      event.headers?.authorization || event.headers?.Authorization || "";

    const correspondencia = authorization.match(/^Bearer (.+)$/i);

    if (!correspondencia) {
      return resposta(401, {
        erro: "Autenticação necessária.",
      });
    }

    const usuario = await admin.auth().verifyIdToken(correspondencia[1]);

    // Verificar autorização
    const usuariosPermitidos = (process.env.NFSE_ALLOWED_UIDS || "")
      .split(",")
      .map((uid) => uid.trim())
      .filter(Boolean);

    if (
      !usuariosPermitidos.length ||
      !usuariosPermitidos.includes(usuario.uid)
    ) {
      return resposta(403, {
        erro: "Usuário sem autorização para consultar NFS-e.",
      });
    }

    // Validar identificador
    const invoiceId = event.queryStringParameters?.invoiceId;

    if (
      typeof invoiceId !== "string" ||
      !/^[a-zA-Z0-9_-]{1,150}$/.test(invoiceId)
    ) {
      return resposta(400, {
        erro: "Informe um invoiceId válido.",
      });
    }

    const apiKey = process.env.NOTAAS_API_KEY;

    if (!apiKey) {
      return resposta(500, {
        erro: "Chave da API Notaas não configurada.",
      });
    }

    const baseUrl = (
      process.env.NOTAAS_BASE_URL || "https://platform.notaas.com.br/api/v1"
    ).replace(/\/+$/, "");

    const respostaNotaas = await fetch(
      `${baseUrl}/invoices/${encodeURIComponent(invoiceId)}/status`,
      {
        method: "GET",
        headers: {
          "x-api-key": apiKey,
          Accept: "application/json",
        },
        signal: AbortSignal.timeout(15000),
      },
    );

    const texto = await respostaNotaas.text();

    let resultado = {};

    try {
      resultado = texto ? JSON.parse(texto) : {};
    } catch {
      resultado = {};
    }

    if (!respostaNotaas.ok) {
      console.error("Erro ao consultar status na Notaas:", {
        status: respostaNotaas.status,
        invoiceId,
      });

      return resposta(
        respostaNotaas.status >= 400 && respostaNotaas.status < 500
          ? respostaNotaas.status
          : 502,
        {
          erro: "Não foi possível consultar o status da NFS-e.",
        },
      );
    }

    // Retornar somente os dados necessários ao painel
    return resposta(200, {
      invoiceId: resultado.invoiceId || invoiceId,
      referencia: resultado.referencia || null,
      status: resultado.status || "desconhecido",
      numeroNfe: resultado.numeroNfe || null,
      chNFSe: resultado.chNFSe || null,
      emittedAt: resultado.emittedAt || null,
      ambiente: resultado.ambiente || null,
      documentsCached: resultado.documentsCached === true,
      pdfUrl: resultado.pdfUrl || null,
      xmlUrl: resultado.xmlUrl || null,
      errorCode: resultado.errorCode || resultado.cod_rejeicao || null,
      errorMessage: resultado.errorMessage || resultado.msg_rejeicao || null,
      errors: resultado.errors || resultado.rejection_errors || null,
    });
  } catch (erro) {
    console.error("Falha ao consultar NFS-e:", erro.message);

    if (erro.name === "TimeoutError" || erro.name === "AbortError") {
      return resposta(504, {
        erro: "Tempo limite ao consultar o status da nota.",
      });
    }

    if (
      erro.code === "auth/id-token-expired" ||
      erro.code === "auth/argument-error" ||
      erro.code === "auth/invalid-id-token" ||
      erro.code === "auth/invalid-credential"
    ) {
      return resposta(401, {
        erro: "Token Firebase inválido ou expirado.",
      });
    }

    return resposta(500, {
      erro: "Falha interna ao consultar a NFS-e.",
    });
  }
};
