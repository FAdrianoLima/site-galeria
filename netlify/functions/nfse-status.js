const admin = require("./firebaseAdmin");
const { obterConfiguracaoNfse } = require("./_nfseConfig");

exports.handler = async (event) => {
  const headers = {
    "Content-Type": "application/json",
    "Cache-Control": "no-store",
  };

  if (event.httpMethod !== "GET") {
    return {
      statusCode: 405,
      headers: { ...headers, Allow: "GET" },
      body: JSON.stringify({ erro: "Método não permitido." }),
    };
  }

  try {
    const authorization = event.headers?.authorization || "";
    const correspondencia = authorization.match(/^Bearer (.+)$/i);

    if (!correspondencia) {
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({ erro: "Autenticação necessária." }),
      };
    }

    const token = correspondencia[1];
    const usuario = await admin.auth().verifyIdToken(token);

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

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        configuracao: {
          ambiente: config.ambiente,
          cnpjConfigurado: config.cnpjPrestador.length === 14,
          razaoSocialConfigurada: Boolean(config.razaoSocial),
          municipioConfigurado: Boolean(config.municipio),
          regimeConfigurado: Boolean(config.regime),
          emissaoHabilitada: config.emissaoHabilitada,
        },
        integracao: {
          conectada: false,
          emissaoDisponivel: false,
          mensagem:
            "Configuração inicial. A autenticação e a comunicação com a API fiscal ainda precisam ser implementadas e validadas.",
        },
      }),
    };
  } catch (erro) {
    console.error("Erro no diagnóstico NFS-e:", erro);

    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        erro: "Falha interna ao consultar a configuração fiscal.",
      }),
    };
  }
};
