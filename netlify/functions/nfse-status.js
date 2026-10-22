const admin = require("./firebaseAdmin");
const { obterConfiguracaoNfse } = require("./_nfseConfig");

const headers = {
  "Content-Type": "application/json",
  "Cache-Control": "no-store",
};

exports.handler = async (event) => {
  if (event.httpMethod !== "GET") {
    return {
      statusCode: 405,
      headers: { ...headers, Allow: "GET" },
      body: JSON.stringify({ erro: "Método não permitido." }),
    };
  }

  try {
    const authorization =
      event.headers?.authorization || event.headers?.Authorization || "";

    const correspondencia = authorization.match(/^Bearer (.+)$/i);

    if (!correspondencia) {
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({ erro: "Autenticação necessária." }),
      };
    }

    const usuario = await admin.auth().verifyIdToken(correspondencia[1]);

    const usuariosPermitidos = (process.env.NFSE_ALLOWED_UIDS || "")
      .split(",")
      .map((uid) => uid.trim())
      .filter(Boolean);

    if (
      usuariosPermitidos.length === 0 ||
      !usuariosPermitidos.includes(usuario.uid)
    ) {
      return {
        statusCode: 403,
        headers,
        body: JSON.stringify({
          erro: "Usuário sem autorização para acessar a configuração fiscal.",
        }),
      };
    }

    const config = obterConfiguracaoNfse();

    const apiKey = process.env.NOTAAS_API_KEY;
    const baseUrl = (
      process.env.NOTAAS_BASE_URL || "https://platform.notaas.com.br/api/v1"
    ).replace(/\/+$/, "");

    let integracao = {
      conectada: false,
      emissaoDisponivel: false,
      mensagem: "",
    };

    if (!apiKey) {
      integracao.mensagem =
        "Chave da Notaas não configurada no ambiente do servidor.";
    } else {
      try {
        const resposta = await fetch(`${baseUrl}/webhooks/endpoints`, {
          method: "GET",
          headers: {
            "x-api-key": apiKey,
            Accept: "application/json",
          },
          signal: AbortSignal.timeout(10000),
        });

        if (resposta.ok) {
          integracao = {
            conectada: true,
            emissaoDisponivel: false,
            mensagem:
              "API Notaas acessível. A emissão ainda não foi habilitada nem validada.",
          };
        } else {
          integracao.mensagem =
            resposta.status === 401 || resposta.status === 403
              ? "A Notaas recusou a autenticação. Confira a chave API no Netlify."
              : `A Notaas respondeu com HTTP ${resposta.status}. A conexão precisa ser verificada.`;
        }
      } catch (erro) {
        console.error("Falha de comunicação com a Notaas:", erro.message);

        integracao.mensagem =
          "Não foi possível estabelecer comunicação com a Notaas. Verifique a rede e a configuração.";
      }
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        configuracao: {
          ambiente: config.ambiente,
          cnpjConfigurado: /^\d{14}$/.test(String(config.cnpjPrestador || "")),
          razaoSocialConfigurada: Boolean(config.razaoSocial),
          municipioConfigurado: Boolean(config.municipio),
          regimeConfigurado: Boolean(config.regime),
          emissaoHabilitada: config.emissaoHabilitada,
        },
        integracao,
      }),
    };
  } catch (erro) {
    console.error("Erro no diagnóstico NFS-e:", erro.message);

    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        erro: "Falha interna ao consultar a configuração fiscal.",
      }),
    };
  }
};
