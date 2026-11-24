// Idade e faixas etárias. A idade é sempre calculada a partir da data de
// nascimento (AAAA-MM-DD), então nunca fica desatualizada.

export const FAIXAS_ETARIAS = [
  { id: "ate17", label: "Até 17 anos", min: 0, max: 17 },
  { id: "18a25", label: "18 a 25 anos", min: 18, max: 25 },
  { id: "26a35", label: "26 a 35 anos", min: 26, max: 35 },
  { id: "36a55", label: "36 a 55 anos", min: 36, max: 55 },
  { id: "56mais", label: "56 anos ou mais", min: 56, max: 200 },
];

export const SEM_IDADE = { id: "semidade", label: "Idade não informada" };

export function calcularIdade(dataNascimento, hoje = new Date()) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(dataNascimento || ""))) return null;

  const [ano, mes, dia] = dataNascimento.split("-").map(Number);
  let idade = hoje.getFullYear() - ano;

  const aindaNaoFezAniversario =
    hoje.getMonth() + 1 < mes ||
    (hoje.getMonth() + 1 === mes && hoje.getDate() < dia);

  if (aindaNaoFezAniversario) idade -= 1;

  return idade >= 0 && idade < 130 ? idade : null;
}

export function faixaEtaria(dataNascimento) {
  const idade = calcularIdade(dataNascimento);
  if (idade === null) return SEM_IDADE;

  return (
    FAIXAS_ETARIAS.find((faixa) => idade >= faixa.min && idade <= faixa.max) ||
    SEM_IDADE
  );
}
