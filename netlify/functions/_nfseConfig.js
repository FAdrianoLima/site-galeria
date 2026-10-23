function obterConfiguracaoNfse() {
  const ambiente = process.env.NFSE_AMBIENTE || "homologacao";

  if (!["homologacao", "producao"].includes(ambiente)) {
    throw new Error("NFSE_AMBIENTE inválido.");
  }

  return {
    ambiente,
    cnpjPrestador: (process.env.NFSE_CNPJ_PRESTADOR || "").replace(/\D/g, ""),
    razaoSocial:
      process.env.NFSE_RAZAO_SOCIAL || "Quelli Bosqueiro Clinica Estetica LTDA",
    municipio: process.env.NFSE_MUNICIPIO || "Caxias do Sul - RS",
    regime: process.env.NFSE_REGIME || "Simples Nacional",
    emissaoHabilitada: process.env.NFSE_EMISSAO_HABILITADA === "true",
  };
}

module.exports = { obterConfiguracaoNfse };
