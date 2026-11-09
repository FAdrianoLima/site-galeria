const admin = require("./firebaseAdmin");
const crypto = require("crypto");

const db = admin.firestore();

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

function obterHeader(event, nome) {
  const chave = Object.keys(event.headers || {}).find(
    (item) => item.toLowerCase() === nome.toLowerCase(),
  );

  return chave ? event.headers[chave] : "";
}

function validarAssinatura(rawBody, assinatura, segredo) {
  if (!rawBody || !assinatura || !segredo) return false;

  const assinaturaRecebida = String(assinatura).replace(/^sha256=/i, "");

  const assinaturaEsperada = crypto
    .createHmac("sha256", segredo)
    .update(rawBody, "utf8")
    .digest("hex");

  const recebida = Buffer.from(assinaturaRecebida, "hex");
  const esperada = Buffer.from(assinaturaEsperada, "hex");

  return (
    recebida.length === esperada.length &&
    crypto.timingSafeEqual(recebida, esperada)
  );
}

function primeiroTexto(...valores) {
  return valores.find(
    (valor) => typeof valor === "string" && valor.trim() !== "",
  );
}

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return resposta(405, { erro: "Método não permitido." });
  }

  try {
    const segredo = process.env.NOTAAS_WEBHOOK_SECRET;

    if (!segredo) {
      console.error("NOTAAS_WEBHOOK_SECRET não configurado.");

      return resposta(500, {
        erro: "Segredo de autenticação do webhook não configurado.",
      });
    }

    const rawBody = event.isBase64Encoded
      ? Buffer.from(event.body || "", "base64").toString("utf8")
      : event.body || "";

    const assinatura = obterHeader(event, "x-notaas-signature");

    if (!validarAssinatura(rawBody, assinatura, segredo)) {
      console.warn("Webhook Notaas recebido com assinatura inválida.");

      return resposta(401, {
        erro: "Assinatura do webhook inválida.",
      });
    }

    let payload;

    try {
      payload = JSON.parse(rawBody);
    } catch {
      return resposta(400, {
        erro: "Corpo JSON inválido.",
      });
    }

    const evento = primeiroTexto(
      payload.event,
      obterHeader(event, "x-notaas-event"),
    );

    const deliveryId = primeiroTexto(
      payload.deliveryId,
      obterHeader(event, "x-notaas-delivery"),
    );

    const dados = payload.data || {};

    if (!evento) {
      return resposta(400, {
        erro: "Evento não informado.",
      });
    }

    const invoiceId = primeiroTexto(
      dados.invoiceId,
      dados.invoice_id,
      dados.invoice?.invoiceId,
      dados.invoice?.id,
    );

    if (!invoiceId) {
      console.error("Webhook sem invoiceId:", evento);

      return resposta(400, {
        erro: "Identificador da nota não informado no evento.",
      });
    }

    // Evita processar novamente uma entrega já recebida.
    const deliveryDocId = deliveryId
      ? crypto.createHash("sha256").update(deliveryId).digest("hex")
      : null;

    const entregaRef = deliveryDocId
      ? db.collection("notaasWebhookDeliveries").doc(deliveryDocId)
      : null;

    const notasRef = db.collection("notasFiscais");

    const consultaNota = notasRef
      .where("nfse.invoiceId", "==", invoiceId)
      .limit(1);

    const resultado = await db.runTransaction(async (transaction) => {
      if (entregaRef) {
        const entregaExistente = await transaction.get(entregaRef);

        if (entregaExistente.exists) {
          return { duplicado: true };
        }
      }

      const resultadoNotas = await transaction.get(consultaNota);

      if (resultadoNotas.empty) {
        return { naoEncontrada: true };
      }

      const notaDoc = resultadoNotas.docs[0];
      const atualizacoes = {
        "nfse.ultimoWebhook": evento,
        "nfse.webhookRecebidoEm": admin.firestore.FieldValue.serverTimestamp(),
      };

      const numeroNfe = primeiroTexto(
        dados.numeroNfe,
        dados.nNFSe,
        dados.numero,
        dados.nota?.numero,
      );

      const chaveNfse = primeiroTexto(
        dados.chNFSe,
        dados.chaveAcesso,
        dados.chave,
      );

      const emittedAt = primeiroTexto(
        dados.emittedAt,
        dados.issuedAt,
        dados.dataEmissao,
      );

      if (evento === "nfse.issued") {
        atualizacoes.status = "emitida";
        atualizacoes["nfse.status"] = "issued";

        if (numeroNfe) atualizacoes["nfse.numeroNfe"] = numeroNfe;
        if (chaveNfse) atualizacoes["nfse.chNFSe"] = chaveNfse;
        if (emittedAt) atualizacoes["nfse.emittedAt"] = emittedAt;
      }

      if (evento === "nfse.error") {
        atualizacoes.status = "erro";
        atualizacoes["nfse.status"] = "error";

        const codigoErro = primeiroTexto(
          dados.errorCode,
          dados.codigo,
          dados.code,
        );

        const mensagemErro = primeiroTexto(
          dados.errorMessage,
          dados.message,
          dados.mensagem,
        );

        if (codigoErro) {
          atualizacoes["nfse.errorCode"] = codigoErro;
        }

        if (mensagemErro) {
          atualizacoes["nfse.errorMessage"] = mensagemErro;
        }

        if (Array.isArray(dados.errors)) {
          atualizacoes["nfse.errors"] = dados.errors;
        }
      }

      if (evento === "nfse.cancelled") {
        atualizacoes.status = "cancelada";
        atualizacoes["nfse.status"] = "cancelled";
      }

      if (evento === "nfse.documents_ready") {
        const pdfUrl = primeiroTexto(dados.pdfUrl, dados.documents?.pdfUrl);
        const xmlUrl = primeiroTexto(dados.xmlUrl, dados.documents?.xmlUrl);
        const cancelXmlUrl = primeiroTexto(
          dados.cancelXmlUrl,
          dados.documents?.cancelXmlUrl,
        );

        if (pdfUrl) atualizacoes["nfse.pdfUrl"] = pdfUrl;
        if (xmlUrl) atualizacoes["nfse.xmlUrl"] = xmlUrl;
        if (cancelXmlUrl) {
          atualizacoes["nfse.cancelXmlUrl"] = cancelXmlUrl;
        }

        if (dados.documentStatus) {
          atualizacoes["nfse.documentStatus"] = dados.documentStatus;
        }

        atualizacoes["nfse.documentsCachedAt"] =
          dados.cachedAt || admin.firestore.FieldValue.serverTimestamp();
      }

      transaction.update(notaDoc.ref, atualizacoes);

      if (entregaRef) {
        transaction.create(entregaRef, {
          deliveryId,
          invoiceId,
          evento,
          recebidoEm: admin.firestore.FieldValue.serverTimestamp(),
        });
      }

      return {
        atualizado: true,
        notaId: notaDoc.id,
      };
    });

    if (resultado.duplicado) {
      return resposta(200, {
        sucesso: true,
        mensagem: "Notificação já processada.",
      });
    }

    if (resultado.naoEncontrada) {
      console.warn("Nota não encontrada para webhook:", invoiceId);

      return resposta(404, {
        erro: "Nota fiscal não encontrada para o invoiceId informado.",
      });
    }

    console.log("Webhook Notaas processado:", {
      evento,
      invoiceId,
      notaId: resultado.notaId,
    });

    return resposta(200, {
      sucesso: true,
      mensagem: "Notificação processada.",
    });
  } catch (erro) {
    console.error("Erro ao processar webhook Notaas:", erro.message);

    return resposta(500, {
      erro: "Falha interna ao processar a notificação.",
    });
  }
};
