const admin = require("./firebaseAdmin");
const { obterConfiguracaoNfse } = require("./_nfseConfig");

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

function objetoValido(valor) {
  return valor !== null && typeof valor === "object" && !Array.isArray(valor);
}

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return resposta(405, { erro: "Método não permitido." });
  }

  try {
    // 1. Autenticação Firebase
    const authorization =
      event.headers?.authorization || event.headers?.Authorization || "";

    const correspondencia = authorization.match(/^Bearer (.+)$/i);

    if (!correspondencia) {
      return resposta(401, {
        erro: "Autenticação necessária.",
      });
    }

    let usuario;

    try {
      usuario = await admin.auth().verifyIdToken(correspondencia[1]);
    } catch (erroAuth) {
      console.warn("Falha na autenticação Firebase:", erroAuth.code);

      return resposta(401, {
        erro: "Token Firebase inválido ou expirado.",
      });
    }

    // 2. Autorizar somente UIDs cadastrados
    const usuariosPermitidos = (process.env.NFSE_ALLOWED_UIDS || "")
      .split(",")
      .map((uid) => uid.trim())
      .filter(Boolean);

    if (
      usuariosPermitidos.length === 0 ||
      !usuariosPermitidos.includes(usuario.uid)
    ) {
      return resposta(403, {
        erro: "Usuário sem autorização para emitir NFS-e.",
      });
    }

    // 3. Conferir configuração fiscal
    const config = obterConfiguracaoNfse();

    if (!/^\d{14}$/.test(config.cnpjPrestador || "")) {
      return resposta(500, {
        erro: "CNPJ do prestador não configurado corretamente.",
      });
    }

    const apiKey = process.env.NOTAAS_API_KEY;

    if (!apiKey) {
      return resposta(500, {
        erro: "Chave da API Notaas não configurada no servidor.",
      });
    }

    // 4. Bloqueio de segurança: emissão desabilitada por padrão
    if (config.emissaoHabilitada !== true) {
      return resposta(403, {
        erro: "Emissão bloqueada pela configuração do servidor.",
        ambiente: config.ambiente,
      });
    }

    // 5. Esta versão permite somente homologação
    if (config.ambiente !== "homologacao") {
      return resposta(403, {
        erro: "Emissão de produção bloqueada nesta versão.",
      });
    }

    // 6. Interpretar e validar o corpo
    let dados;

    try {
      dados = JSON.parse(event.body || "{}");
    } catch {
      return resposta(400, {
        erro: "Corpo JSON inválido.",
      });
    }

    if (!objetoValido(dados)) {
      return resposta(400, {
        erro: "O corpo da solicitação deve ser um objeto JSON.",
      });
    }

    const { tomador, servico, valores, competencia, referencia } = dados;

    if (!objetoValido(tomador)) {
      return resposta(400, {
        erro: "Dados do tomador ausentes ou inválidos.",
      });
    }

    if (typeof tomador.nome !== "string" || !tomador.nome.trim()) {
      return resposta(400, {
        erro: "Informe o nome do tomador do serviço.",
      });
    }

    if (!objetoValido(servico)) {
      return resposta(400, {
        erro: "Dados do serviço ausentes ou inválidos.",
      });
    }

    if (typeof servico.descricao !== "string" || !servico.descricao.trim()) {
      return resposta(400, {
        erro: "Informe a descrição do serviço.",
      });
    }

    if (!objetoValido(valores)) {
      return resposta(400, {
        erro: "Valores do serviço ausentes ou inválidos.",
      });
    }

    if (
      typeof valores.total !== "number" ||
      !Number.isFinite(valores.total) ||
      valores.total <= 0
    ) {
      return resposta(400, {
        erro: "O valor total deve ser um número maior que zero.",
      });
    }

    if (
      competencia !== undefined &&
      competencia !== null &&
      competencia !== "" &&
      (typeof competencia !== "string" ||
        !/^\d{4}-(0[1-9]|1[0-2])$/.test(competencia))
    ) {
      return resposta(400, {
        erro: "Competência inválida. Use o formato AAAA-MM.",
      });
    }

    if (
      referencia !== undefined &&
      (typeof referencia !== "string" || referencia.length > 100)
    ) {
      return resposta(400, {
        erro: "Referência inválida. Use um texto de até 100 caracteres.",
      });
    }

    // Encaminhar somente os campos de nível superior previstos.
    // Os campos internos devem seguir o esquema confirmado da Notaas.

    const aliquotaConfigurada = process.env.NFSE_ALIQUOTA_ISS;

    if (
      aliquotaConfigurada === undefined ||
      aliquotaConfigurada.trim() === "" ||
      !Number.isFinite(Number(aliquotaConfigurada)) ||
      Number(aliquotaConfigurada) < 0 ||
      Number(aliquotaConfigurada) > 100
    ) {
      return resposta(500, {
        erro: "Alíquota de ISS não configurada corretamente no servidor.",
      });
    }

    const payload = {
      tomador,
      servico,
      valores: {
        ...valores,
        aliquotaIss: Number(aliquotaConfigurada),
      },
    };

    if (competencia) payload.competencia = competencia;
    if (referencia) payload.referencia = referencia;

    // 7. Solicitar emissão à Notaas
    const baseUrl = (
      process.env.NOTAAS_BASE_URL || "https://platform.notaas.com.br/api/v1"
    ).replace(/\/+$/, "");

    const respostaNotaas = await fetch(`${baseUrl}/emitir`, {
      method: "POST",
      headers: {
        "x-api-key": apiKey,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(20000),
    });

    const textoResposta = await respostaNotaas.text();

    let resultadoNotaas;

    try {
      resultadoNotaas = textoResposta ? JSON.parse(textoResposta) : {};
    } catch {
      resultadoNotaas = {
        mensagem: textoResposta.slice(0, 1000),
      };
    }

    if (!respostaNotaas.ok) {
      console.error("Notaas recusou a solicitação:", {
        status: respostaNotaas.status,
        resposta: resultadoNotaas,
      });

      const statusCliente =
        respostaNotaas.status >= 400 && respostaNotaas.status < 500
          ? respostaNotaas.status
          : 502;

      return resposta(statusCliente, {
        erro: "A Notaas não aceitou a solicitação de emissão.",
        detalhes: resultadoNotaas,
      });
    }

    // Não declarar sucesso se não houver identificador para consulta.
    const dadosResposta =
      resultadoNotaas?.data && typeof resultadoNotaas.data === "object"
        ? resultadoNotaas.data
        : resultadoNotaas;

    const invoiceId =
      typeof dadosResposta?.invoiceId === "string"
        ? dadosResposta.invoiceId.trim()
        : "";

    if (!invoiceId) {
      console.error("Resposta da Notaas sem invoiceId válido:", {
        status: respostaNotaas.status,
        campos: Object.keys(dadosResposta || {}),
      });

      return resposta(502, {
        erro: "A Notaas não retornou um identificador válido. Consulte o painel da Notaas antes de repetir a solicitação.",
      });
    }

    return resposta(202, {
      sucesso: true,
      mensagem: "Solicitação encaminhada à Notaas.",
      invoiceId,
      status: dadosResposta.status || "queued",
      referencia: dadosResposta.referencia || referencia || null,
      pollUrl: dadosResposta.pollUrl || null,
      ambiente: config.ambiente,
    });

    // 8. Retornar o identificador para acompanhamento
    return resposta(202, {
      sucesso: true,
      mensagem: "Solicitação encaminhada à Notaas.",
      invoiceId: resultadoNotaas.invoiceId,
      status: resultadoNotaas.status || "queued",
      referencia: resultadoNotaas.referencia || referencia || null,
      pollUrl: resultadoNotaas.pollUrl || null,
      ambiente: config.ambiente,
    });
  } catch (erro) {
    console.error("Erro na solicitação de NFS-e:", erro.message);

    if (erro.name === "TimeoutError" || erro.name === "AbortError") {
      return resposta(504, {
        erro: "Tempo limite ao aguardar a Notaas. Consulte o status antes de tentar novamente, para evitar duplicidade.",
      });
    }

    return resposta(500, {
      erro: "Falha interna ao processar a solicitação de NFS-e.",
    });
  }
};
