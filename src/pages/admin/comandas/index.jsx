import * as React from "react";
import Admin from "../../../components/admin";
import {
  ReadAll as ReadComandas,
  Create,
  AtualizarItens,
  DarBaixa,
  RegistrarPagamento,
  Cancelar,
  linhaParaItem,
  calcularTotais,
  sessoesRealizadas,
  saldoItem,
  saldoAPagar,
  FORMAS_PAGAMENTO,
} from "../../../services/comandas";
import { ReadAll as ReadClientes } from "../../../services/clientes";
import { ReadAll as ReadServicos } from "../../../services/servicos";

import {
  Alert,
  Autocomplete,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControl,
  FormControlLabel,
  Grid,
  IconButton,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Snackbar,
  Stack,
  Switch,
  TextField,
  Typography,
} from "@mui/material";

import AddIcon from "@mui/icons-material/Add";
import RefreshIcon from "@mui/icons-material/Refresh";
import PrintIcon from "@mui/icons-material/Print";
import PaymentsIcon from "@mui/icons-material/Payments";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import ReceiptLongIcon from "@mui/icons-material/ReceiptLong";

const formatarMoeda = (valor) =>
  Number(valor || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });

const formatarDataISO = (iso) => {
  if (!iso) return "-";
  const [a, m, d] = String(iso).slice(0, 10).split("-");
  return a && m && d ? `${d}/${m}/${a}` : iso;
};

const novaChave = () =>
  `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

const novaLinha = () => ({
  novo: true,
  key: novaChave(),
  servicoId: "",
  quantidade: 1,
});

const FORM_INICIAL = () => ({
  cliente: null,
  linhas: [novaLinha()],
  descTipo: "percentual",
  descValor: "",
  observacoes: "",
});

const STATUS = {
  aberta: { label: "Aberta", color: "warning" },
  fechada: { label: "Fechada", color: "success" },
  cancelada: { label: "Cancelada", color: "default" },
};

const escapeHtml = (texto) =>
  String(texto ?? "").replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );

// Abre uma janela de impressão (o navegador permite "Salvar como PDF").
function imprimirComanda(comanda) {
  const linhas = comanda.itens
    .map((item) => {
      const feitas = sessoesRealizadas(comanda, item.id);
      return `<tr>
        <td>${escapeHtml(item.nome)}${item.tipo === "pacote" ? " (pacote)" : ""}</td>
        <td style="text-align:center">${item.quantidade}</td>
        <td style="text-align:center">${feitas}/${item.sessoesTotal}</td>
        <td style="text-align:right">${formatarMoeda(item.valorUnitario * item.quantidade)}</td>
      </tr>`;
    })
    .join("");

  const pagamentos = (comanda.pagamentos || [])
    .map(
      (p) =>
        `<div>${formatarDataISO(p.data)} — ${escapeHtml(p.forma)}: ${formatarMoeda(p.valor)}</div>`,
    )
    .join("");

  const janela = window.open("", "_blank", "width=800,height=900");
  if (!janela) return false;

  janela.document.write(`<!doctype html><html><head><meta charset="utf-8">
    <title>Comanda #${comanda.numero}</title>
    <style>
      body{font-family:Arial,sans-serif;color:#222;margin:32px;font-size:14px}
      h1{font-size:20px;margin:0 0 4px} table{width:100%;border-collapse:collapse;margin-top:16px}
      th,td{border-bottom:1px solid #ddd;padding:8px;text-align:left} th{font-size:12px;color:#555}
      .tot{margin-top:16px;text-align:right;line-height:1.7}
      .assinatura{margin-top:64px;border-top:1px solid #333;width:320px;padding-top:6px;font-size:12px}
    </style></head><body>
    <h1>Galeria da Beleza — Comanda #${comanda.numero}</h1>
    <div>Cliente: <strong>${escapeHtml(comanda.clienteNome)}</strong></div>
    <div>Situação: ${escapeHtml(STATUS[comanda.status]?.label || comanda.status)}</div>
    <table><thead><tr><th>Item</th><th style="text-align:center">Qtd.</th>
    <th style="text-align:center">Sessões</th><th style="text-align:right">Valor</th></tr></thead>
    <tbody>${linhas}</tbody></table>
    <div class="tot">
      <div>Subtotal: ${formatarMoeda(comanda.subtotal)}</div>
      ${comanda.valorDesconto > 0 ? `<div>Desconto: -${formatarMoeda(comanda.valorDesconto)}</div>` : ""}
      <div><strong>Total: ${formatarMoeda(comanda.total)}</strong></div>
      <div>Pago: ${formatarMoeda(comanda.valorPago)} · A pagar: ${formatarMoeda(saldoAPagar(comanda))}</div>
    </div>
    ${pagamentos ? `<div style="margin-top:12px"><strong>Pagamentos</strong>${pagamentos}</div>` : ""}
    ${comanda.observacoes ? `<p>Obs.: ${escapeHtml(comanda.observacoes)}</p>` : ""}
    <div class="assinatura">Assinatura do cliente</div>
    <script>window.onload=function(){window.print()}</script>
    </body></html>`);
  janela.document.close();
  return true;
}

export default function Comandas() {
  const [comandas, setComandas] = React.useState([]);
  const [clientes, setClientes] = React.useState([]);
  const [servicos, setServicos] = React.useState([]);

  const [carregando, setCarregando] = React.useState(true);
  const [salvando, setSalvando] = React.useState(false);
  const [erro, setErro] = React.useState("");
  const [aviso, setAviso] = React.useState("");

  const [busca, setBusca] = React.useState("");
  const [filtroStatus, setFiltroStatus] = React.useState("aberta");

  const [modalAberto, setModalAberto] = React.useState(false);
  const [comanda, setComanda] = React.useState(null); // null = nova
  const [form, setForm] = React.useState(FORM_INICIAL);

  const [baixaAlvo, setBaixaAlvo] = React.useState(null); // { item, quantidade }
  const [gerarNota, setGerarNota] = React.useState(true);

  const [pagamentoAberto, setPagamentoAberto] = React.useState(false);
  const [formaPag, setFormaPag] = React.useState("");
  const [valorPag, setValorPag] = React.useState("");

  const [cancelando, setCancelando] = React.useState(false);

  const carregar = React.useCallback(async () => {
    setCarregando(true);
    setErro("");

    try {
      const [lc, lcl, ls] = await Promise.all([
        ReadComandas(),
        ReadClientes(),
        ReadServicos(),
      ]);
      setComandas(lc);
      setClientes(lcl);
      setServicos(ls);
      return lc;
    } catch (error) {
      console.error("Erro ao carregar comandas:", error);
      setErro(
        error?.code === "permission-denied"
          ? "Sem permissão para ler as comandas. Confira as regras do Firestore."
          : "Não foi possível carregar as comandas.",
      );
      return [];
    } finally {
      setCarregando(false);
    }
  }, []);

  React.useEffect(() => {
    carregar();
  }, [carregar]);

  // ----------------------------------------------------------
  // Formulário
  // ----------------------------------------------------------

  const preencherForm = (c) => ({
    cliente: { id: c.clienteId, nome: c.clienteNome },
    linhas: c.itens.map((i) => ({ ...i })),
    descTipo: c.desconto?.tipo || "percentual",
    descValor: c.desconto?.valor ?? "",
    observacoes: c.observacoes || "",
  });

  const abrirNova = () => {
    setComanda(null);
    setForm(FORM_INICIAL());
    setErro("");
    setModalAberto(true);
  };

  const abrirComanda = (c) => {
    setComanda(c);
    setForm(preencherForm(c));
    setErro("");
    setModalAberto(true);
  };

  const fecharModal = () => {
    if (salvando) return;
    setModalAberto(false);
    setComanda(null);
    setErro("");
  };

  // Recarrega tudo e mantém o modal aberto já com os dados atualizados.
  const atualizarComandaAberta = async (id) => {
    const lista = await carregar();
    const atualizada = lista.find((c) => c.id === id);

    if (atualizada) {
      setComanda(atualizada);
      setForm(preencherForm(atualizada));
    }
  };

  const alterarLinha = (key, campo, valor) =>
    setForm((atual) => ({
      ...atual,
      linhas: atual.linhas.map((l) =>
        (l.key || l.id) === key ? { ...l, [campo]: valor } : l,
      ),
    }));

  const removerLinha = (key) =>
    setForm((atual) => ({
      ...atual,
      linhas: atual.linhas.filter((l) => (l.key || l.id) !== key),
    }));

  const itensPreview = form.linhas
    .map((l) => linhaParaItem(l, servicos))
    .filter(Boolean);

  const desconto =
    Number(form.descValor) > 0
      ? { tipo: form.descTipo, valor: Number(form.descValor) }
      : null;

  const totais = calcularTotais(itensPreview, desconto);

  const alterado = comanda
    ? JSON.stringify({
        i: itensPreview.map((i) => [i.id, i.quantidade]),
        d: desconto,
        o: form.observacoes.trim(),
      }) !==
      JSON.stringify({
        i: comanda.itens.map((i) => [i.id, i.quantidade]),
        d: comanda.desconto || null,
        o: (comanda.observacoes || "").trim(),
      })
    : true;

  const salvar = async () => {
    setErro("");

    if (!form.cliente?.id) return setErro("Selecione um cliente.");
    if (itensPreview.length === 0)
      return setErro("Adicione pelo menos um item válido.");
    if (itensPreview.length !== form.linhas.length) {
      return setErro(
        "Há itens sem serviço selecionado ou com quantidade inválida.",
      );
    }
    if (form.descTipo === "percentual" && Number(form.descValor) > 100) {
      return setErro("O desconto percentual não pode passar de 100%.");
    }

    setSalvando(true);

    try {
      if (comanda) {
        await AtualizarItens(
          comanda.id,
          itensPreview,
          desconto,
          form.observacoes,
        );
        setAviso("Comanda atualizada.");
        await atualizarComandaAberta(comanda.id);
      } else {
        const criada = await Create({
          clienteId: form.cliente.id,
          clienteNome: form.cliente.nome,
          itens: itensPreview,
          desconto,
          observacoes: form.observacoes,
        });
        setAviso(`Comanda #${criada.numero} criada.`);
        setModalAberto(false);
        await carregar();
      }
    } catch (error) {
      console.error("Erro ao salvar comanda:", error);
      setErro(error.message || "Não foi possível salvar a comanda.");
    } finally {
      setSalvando(false);
    }
  };

  // ----------------------------------------------------------
  // Baixa de sessões
  // ----------------------------------------------------------

  const confirmarBaixa = async () => {
    if (!baixaAlvo || !comanda) return;

    setSalvando(true);
    setErro("");

    try {
      const r = await DarBaixa(
        comanda.id,
        baixaAlvo.item.id,
        baixaAlvo.quantidade,
        {
          gerarNota,
        },
      );

      setAviso(
        `Baixa registrada: ${r.sessoesRealizadas}/${r.sessoesTotal} sessões.` +
          (r.notaCriada ? " Rascunho de nota criado em Notas fiscais." : ""),
      );
      setBaixaAlvo(null);
      await atualizarComandaAberta(comanda.id);
    } catch (error) {
      console.error("Erro na baixa:", error);
      setErro(error.message || "Não foi possível registrar a baixa.");
      setBaixaAlvo(null);
    } finally {
      setSalvando(false);
    }
  };

  // ----------------------------------------------------------
  // Pagamento
  // ----------------------------------------------------------

  const abrirPagamento = () => {
    setFormaPag(comanda.formaPagamento || "");
    setValorPag(String(saldoAPagar(comanda)));
    setPagamentoAberto(true);
  };

  const confirmarPagamento = async () => {
    setSalvando(true);
    setErro("");

    try {
      await RegistrarPagamento(comanda.id, {
        forma: formaPag,
        valor: Number(String(valorPag).replace(",", ".")),
      });
      setAviso("Pagamento registrado.");
      setPagamentoAberto(false);
      await atualizarComandaAberta(comanda.id);
    } catch (error) {
      console.error("Erro no pagamento:", error);
      setErro(error.message || "Não foi possível registrar o pagamento.");
    } finally {
      setSalvando(false);
    }
  };

  const confirmarCancelamento = async () => {
    setSalvando(true);

    try {
      await Cancelar(comanda.id);
      setAviso("Comanda cancelada.");
      setCancelando(false);
      setModalAberto(false);
      setComanda(null);
      await carregar();
    } catch (error) {
      setErro(error.message || "Não foi possível cancelar a comanda.");
      setCancelando(false);
    } finally {
      setSalvando(false);
    }
  };

  // ----------------------------------------------------------
  // Lista
  // ----------------------------------------------------------

  const listaFiltrada = React.useMemo(() => {
    const termo = busca.trim().toLowerCase();

    return comandas.filter((c) => {
      if (filtroStatus !== "todas" && c.status !== filtroStatus) return false;
      if (!termo) return true;
      return `${c.numero} ${c.clienteNome}`.toLowerCase().includes(termo);
    });
  }, [comandas, busca, filtroStatus]);

  const resumoSessoes = (c) => {
    const total = c.itens.reduce((t, i) => t + i.sessoesTotal, 0);
    return `${(c.baixas || []).length}/${total}`;
  };

  const servicosAtivos = servicos.filter((s) => s.ativo !== false);
  const editavel = !comanda || comanda.status !== "cancelada";
  const saldoPagar = comanda ? saldoAPagar(comanda) : 0;

  return (
    <Admin>
      <Box sx={{ width: "100%", pb: 4 }}>
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: 2,
            mb: 3,
          }}
        >
          <Box>
            <Typography variant="h4" fontWeight={700}>
              Comandas
            </Typography>
            <Typography color="text.secondary">
              Pedidos dos clientes, pacotes de sessões e pagamentos.
            </Typography>
          </Box>

          <Box sx={{ display: "flex", gap: 1 }}>
            <Button
              variant="outlined"
              startIcon={<RefreshIcon />}
              onClick={carregar}
              disabled={carregando}
            >
              Atualizar
            </Button>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={abrirNova}
            >
              Nova comanda
            </Button>
          </Box>
        </Box>

        {erro && !modalAberto && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setErro("")}>
            {erro}
          </Alert>
        )}

        <Paper
          elevation={0}
          sx={{ p: 2, mb: 2.5, border: "1px solid #eee", borderRadius: 3 }}
        >
          <Grid container spacing={2}>
            <Grid item xs={12} sm={8}>
              <TextField
                fullWidth
                size="small"
                label="Buscar por cliente ou número"
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <FormControl fullWidth size="small">
                <InputLabel id="fs">Situação</InputLabel>
                <Select
                  labelId="fs"
                  label="Situação"
                  value={filtroStatus}
                  onChange={(e) => setFiltroStatus(e.target.value)}
                >
                  <MenuItem value="todas">Todas</MenuItem>
                  <MenuItem value="aberta">Abertas</MenuItem>
                  <MenuItem value="fechada">Fechadas</MenuItem>
                  <MenuItem value="cancelada">Canceladas</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </Paper>

        {carregando ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
            <CircularProgress />
          </Box>
        ) : listaFiltrada.length === 0 ? (
          <Paper
            elevation={0}
            sx={{
              p: 5,
              textAlign: "center",
              border: "1px solid #eee",
              borderRadius: 3,
            }}
          >
            <ReceiptLongIcon
              sx={{ fontSize: 42, color: "text.disabled", mb: 1 }}
            />
            <Typography variant="h6" fontWeight={700}>
              Nenhuma comanda encontrada
            </Typography>
            <Typography color="text.secondary" sx={{ mt: 1, mb: 3 }}>
              Crie uma comanda para vincular serviços ou pacotes a um cliente.
            </Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={abrirNova}
            >
              Nova comanda
            </Button>
          </Paper>
        ) : (
          <Stack spacing={1.5}>
            {listaFiltrada.map((c) => {
              const saldo = saldoAPagar(c);
              return (
                <Paper
                  key={c.id}
                  elevation={0}
                  onClick={() => abrirComanda(c)}
                  sx={{
                    p: 2.5,
                    border: "1px solid #eee",
                    borderRadius: 3,
                    cursor: "pointer",
                    "&:hover": { borderColor: "primary.main" },
                  }}
                >
                  <Grid container spacing={2} alignItems="center">
                    <Grid item xs={12} sm={4}>
                      <Typography variant="body2" color="text.secondary">
                        Comanda #{c.numero}
                      </Typography>
                      <Typography fontWeight={700}>{c.clienteNome}</Typography>
                      <Typography variant="body2" color="text.secondary">
                        {c.itens.map((i) => i.nome).join(", ")}
                      </Typography>
                    </Grid>
                    <Grid item xs={6} sm={2}>
                      <Typography variant="body2" color="text.secondary">
                        Sessões realizadas
                      </Typography>
                      <Typography fontWeight={700}>
                        {resumoSessoes(c)}
                      </Typography>
                    </Grid>
                    <Grid item xs={6} sm={2}>
                      <Typography variant="body2" color="text.secondary">
                        Total
                      </Typography>
                      <Typography fontWeight={700}>
                        {formatarMoeda(c.total)}
                      </Typography>
                    </Grid>
                    <Grid
                      item
                      xs={12}
                      sm={4}
                      sx={{
                        display: "flex",
                        gap: 1,
                        justifyContent: { sm: "flex-end" },
                      }}
                    >
                      <Chip
                        size="small"
                        variant="outlined"
                        label={STATUS[c.status]?.label || c.status}
                        color={STATUS[c.status]?.color || "default"}
                      />
                      {c.status !== "cancelada" && (
                        <Chip
                          size="small"
                          variant="outlined"
                          label={
                            saldo <= 0
                              ? "Pago"
                              : (c.valorPago || 0) > 0
                                ? `Falta ${formatarMoeda(saldo)}`
                                : "Pagamento pendente"
                          }
                          color={saldo <= 0 ? "success" : "warning"}
                        />
                      )}
                    </Grid>
                  </Grid>
                </Paper>
              );
            })}
          </Stack>
        )}

        {/* ======================= MODAL DA COMANDA ======================= */}
        <Dialog
          open={modalAberto}
          onClose={fecharModal}
          fullWidth
          maxWidth="md"
        >
          <DialogTitle sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
            {comanda ? `Comanda #${comanda.numero}` : "Nova comanda"}
            {comanda && (
              <Chip
                size="small"
                variant="outlined"
                label={STATUS[comanda.status]?.label}
                color={STATUS[comanda.status]?.color}
              />
            )}
          </DialogTitle>

          <DialogContent dividers>
            {erro && (
              <Alert
                severity="error"
                sx={{ mb: 2 }}
                onClose={() => setErro("")}
              >
                {erro}
              </Alert>
            )}

            <Stack spacing={2.5} sx={{ pt: 0.5 }}>
              <Autocomplete
                options={clientes.filter((c) => c.ativo !== false)}
                getOptionLabel={(c) => c.nome || ""}
                isOptionEqualToValue={(a, b) => a.id === b.id}
                value={form.cliente}
                disabled={Boolean(comanda)}
                onChange={(_, valor) =>
                  setForm((a) => ({ ...a, cliente: valor }))
                }
                renderInput={(params) => (
                  <TextField {...params} label="Cliente" required />
                )}
                noOptionsText="Nenhum cliente encontrado"
              />

              <Divider textAlign="left">Itens</Divider>

              {form.linhas.map((linha) => {
                const chave = linha.key || linha.id;
                const item = linhaParaItem(linha, servicos);
                const feitas =
                  comanda && !linha.novo
                    ? sessoesRealizadas(comanda, linha.id)
                    : 0;
                const saldo =
                  comanda && !linha.novo ? saldoItem(comanda, linha) : 0;
                const baixasDoItem =
                  comanda && !linha.novo
                    ? (comanda.baixas || []).filter(
                        (b) => b.itemId === linha.id,
                      )
                    : [];

                return (
                  <Paper
                    key={chave}
                    variant="outlined"
                    sx={{ p: 2, borderRadius: 2 }}
                  >
                    <Grid container spacing={2} alignItems="center">
                      <Grid item xs={12} sm={6}>
                        {linha.novo ? (
                          <FormControl fullWidth size="small">
                            <InputLabel>Serviço ou pacote</InputLabel>
                            <Select
                              label="Serviço ou pacote"
                              value={linha.servicoId}
                              onChange={(e) =>
                                alterarLinha(chave, "servicoId", e.target.value)
                              }
                            >
                              {servicosAtivos.map((s) => (
                                <MenuItem key={s.id} value={s.id}>
                                  {s.tipo === "pacote"
                                    ? `[Pacote ${s.sessoes} sessões] `
                                    : ""}
                                  {s.nome} — {formatarMoeda(s.valor)}
                                </MenuItem>
                              ))}
                            </Select>
                          </FormControl>
                        ) : (
                          <>
                            <Typography fontWeight={700}>
                              {linha.nome}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              {linha.tipo === "pacote"
                                ? `Pacote de ${linha.sessoesPorUnidade} sessões`
                                : "Serviço avulso"}{" "}
                              · {formatarMoeda(linha.valorUnitario)} cada
                            </Typography>
                          </>
                        )}
                      </Grid>

                      <Grid item xs={6} sm={2}>
                        <TextField
                          size="small"
                          type="number"
                          label="Qtd."
                          value={linha.quantidade}
                          onChange={(e) =>
                            alterarLinha(chave, "quantidade", e.target.value)
                          }
                          inputProps={{
                            min: Math.max(
                              1,
                              Math.ceil(
                                feitas / (linha.sessoesPorUnidade || 1),
                              ),
                            ),
                            step: 1,
                          }}
                          disabled={!editavel}
                          fullWidth
                        />
                      </Grid>

                      <Grid item xs={4} sm={3}>
                        <Typography variant="body2" color="text.secondary">
                          Subtotal
                        </Typography>
                        <Typography fontWeight={700}>
                          {item
                            ? formatarMoeda(
                                item.valorUnitario * item.quantidade,
                              )
                            : "—"}
                        </Typography>
                      </Grid>

                      <Grid item xs={2} sm={1} sx={{ textAlign: "right" }}>
                        {editavel && feitas === 0 && form.linhas.length > 1 && (
                          <IconButton
                            size="small"
                            color="error"
                            aria-label="Remover item"
                            onClick={() => removerLinha(chave)}
                          >
                            <DeleteOutlineIcon fontSize="small" />
                          </IconButton>
                        )}
                      </Grid>

                      {comanda && !linha.novo && item && (
                        <Grid item xs={12}>
                          <Divider sx={{ mb: 1.5 }} />
                          <Stack
                            direction={{ xs: "column", sm: "row" }}
                            spacing={1.5}
                            alignItems={{ sm: "center" }}
                            justifyContent="space-between"
                          >
                            <Box>
                              <Typography fontWeight={700}>
                                {feitas}/{item.sessoesTotal} sessões realizadas
                              </Typography>
                              {baixasDoItem.length > 0 && (
                                <Stack
                                  direction="row"
                                  spacing={0.5}
                                  flexWrap="wrap"
                                  useFlexGap
                                  sx={{ mt: 0.5 }}
                                >
                                  {baixasDoItem.map((b) => (
                                    <Chip
                                      key={b.id}
                                      size="small"
                                      label={`${formatarDataISO(b.data)}${b.agendamentoId ? " · agenda" : ""}`}
                                    />
                                  ))}
                                </Stack>
                              )}
                            </Box>

                            <Stack direction="row" spacing={1}>
                              <Button
                                size="small"
                                variant="outlined"
                                disabled={
                                  saldo < 1 ||
                                  alterado ||
                                  comanda.status === "cancelada"
                                }
                                onClick={() => {
                                  setGerarNota(linha.tipo !== "pacote");
                                  setBaixaAlvo({ item: linha, quantidade: 1 });
                                }}
                              >
                                Dar baixa em 1
                              </Button>
                              <Button
                                size="small"
                                variant="outlined"
                                disabled={
                                  saldo < 2 ||
                                  alterado ||
                                  comanda.status === "cancelada"
                                }
                                onClick={() => {
                                  setGerarNota(linha.tipo !== "pacote");
                                  setBaixaAlvo({
                                    item: linha,
                                    quantidade: saldo,
                                  });
                                }}
                              >
                                Dar baixa em todas ({saldo})
                              </Button>
                            </Stack>
                          </Stack>
                        </Grid>
                      )}
                    </Grid>
                  </Paper>
                );
              })}

              {editavel && (
                <Button
                  startIcon={<AddIcon />}
                  sx={{ alignSelf: "flex-start" }}
                  onClick={() =>
                    setForm((a) => ({
                      ...a,
                      linhas: [...a.linhas, novaLinha()],
                    }))
                  }
                >
                  {comanda ? "Adicionar item ou sessões" : "Adicionar item"}
                </Button>
              )}

              <Divider textAlign="left">Desconto e observações</Divider>

              <Grid container spacing={2}>
                <Grid item xs={12} sm={4}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Tipo de desconto</InputLabel>
                    <Select
                      label="Tipo de desconto"
                      value={form.descTipo}
                      disabled={!editavel}
                      onChange={(e) =>
                        setForm((a) => ({ ...a, descTipo: e.target.value }))
                      }
                    >
                      <MenuItem value="percentual">Percentual (%)</MenuItem>
                      <MenuItem value="valor">Valor fixo (R$)</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <TextField
                    fullWidth
                    size="small"
                    type="number"
                    label={
                      form.descTipo === "percentual"
                        ? "Desconto (%)"
                        : "Desconto (R$)"
                    }
                    value={form.descValor}
                    disabled={!editavel}
                    onChange={(e) =>
                      setForm((a) => ({ ...a, descValor: e.target.value }))
                    }
                    inputProps={{ min: 0, step: "0.01" }}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    multiline
                    minRows={2}
                    label="Observações"
                    value={form.observacoes}
                    disabled={!editavel}
                    onChange={(e) =>
                      setForm((a) => ({ ...a, observacoes: e.target.value }))
                    }
                  />
                </Grid>
              </Grid>

              <Paper
                variant="outlined"
                sx={{ p: 2, borderRadius: 2, bgcolor: "#FAFAFC" }}
              >
                <Stack spacing={0.5} alignItems="flex-end">
                  <Typography variant="body2">
                    Subtotal: {formatarMoeda(totais.subtotal)}
                  </Typography>
                  {totais.valorDesconto > 0 && (
                    <Typography variant="body2">
                      Desconto: -{formatarMoeda(totais.valorDesconto)}
                    </Typography>
                  )}
                  <Typography variant="h6" fontWeight={700}>
                    Total: {formatarMoeda(totais.total)}
                  </Typography>
                  {comanda && (
                    <Typography variant="body2" color="text.secondary">
                      Pago: {formatarMoeda(comanda.valorPago)} · A pagar:{" "}
                      {formatarMoeda(saldoPagar)}
                      {comanda.formaPagamento
                        ? ` · Última forma: ${comanda.formaPagamento}`
                        : ""}
                    </Typography>
                  )}
                </Stack>
              </Paper>

              {comanda && alterado && editavel && (
                <Alert severity="info">
                  Salve as alterações para liberar a baixa de sessões e o
                  pagamento.
                </Alert>
              )}
            </Stack>
          </DialogContent>

          <DialogActions sx={{ p: 2, flexWrap: "wrap", gap: 1 }}>
            {comanda && comanda.status !== "cancelada" && (
              <Button
                color="error"
                onClick={() => setCancelando(true)}
                sx={{ mr: "auto" }}
              >
                Cancelar comanda
              </Button>
            )}

            {comanda && (
              <Button
                startIcon={<PrintIcon />}
                onClick={() => imprimirComanda(comanda)}
                disabled={alterado}
              >
                Gerar comanda
              </Button>
            )}

            {comanda && comanda.status !== "cancelada" && (
              <Button
                variant="outlined"
                startIcon={<PaymentsIcon />}
                disabled={saldoPagar <= 0 || alterado}
                onClick={abrirPagamento}
              >
                {saldoPagar <= 0 ? "Pago" : "Registrar pagamento"}
              </Button>
            )}

            <Button onClick={fecharModal} disabled={salvando}>
              Fechar
            </Button>

            {editavel && (
              <Button
                variant="contained"
                onClick={salvar}
                disabled={salvando || (comanda && !alterado)}
              >
                {salvando ? (
                  <CircularProgress size={22} color="inherit" />
                ) : comanda ? (
                  "Salvar alterações"
                ) : (
                  "Criar comanda"
                )}
              </Button>
            )}
          </DialogActions>
        </Dialog>

        {/* ======================= CONFIRMAR BAIXA ======================= */}
        <Dialog
          open={Boolean(baixaAlvo)}
          onClose={() => !salvando && setBaixaAlvo(null)}
          maxWidth="xs"
          fullWidth
        >
          <DialogTitle>Confirmar atendimento realizado?</DialogTitle>
          <DialogContent>
            <Typography sx={{ mb: 2 }}>
              Serão descontadas <strong>{baixaAlvo?.quantidade}</strong>{" "}
              sessão(ões) de <strong>{baixaAlvo?.item?.nome}</strong>.
            </Typography>
            <FormControlLabel
              control={
                <Switch
                  checked={gerarNota}
                  onChange={(e) => setGerarNota(e.target.checked)}
                />
              }
              label="Criar rascunho de nota fiscal"
            />
          </DialogContent>
          <DialogActions sx={{ p: 2 }}>
            <Button onClick={() => setBaixaAlvo(null)} disabled={salvando}>
              Voltar
            </Button>
            <Button
              variant="contained"
              onClick={confirmarBaixa}
              disabled={salvando}
            >
              {salvando ? (
                <CircularProgress size={22} color="inherit" />
              ) : (
                "Confirmar baixa"
              )}
            </Button>
          </DialogActions>
        </Dialog>

        {/* ======================= PAGAMENTO ======================= */}
        <Dialog
          open={pagamentoAberto}
          onClose={() => !salvando && setPagamentoAberto(false)}
          maxWidth="xs"
          fullWidth
        >
          <DialogTitle>Registrar pagamento</DialogTitle>
          <DialogContent>
            <Stack spacing={2} sx={{ pt: 1 }}>
              <Alert severity="info">
                O pagamento é feito fora do sistema. Aqui você só registra a
                forma utilizada.
              </Alert>
              <FormControl fullWidth required>
                <InputLabel id="forma">Forma de pagamento</InputLabel>
                <Select
                  labelId="forma"
                  label="Forma de pagamento"
                  value={formaPag}
                  onChange={(e) => setFormaPag(e.target.value)}
                >
                  {FORMAS_PAGAMENTO.map((f) => (
                    <MenuItem key={f} value={f}>
                      {f}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <TextField
                label="Valor (R$)"
                value={valorPag}
                onChange={(e) => setValorPag(e.target.value)}
                inputProps={{ inputMode: "decimal" }}
                helperText={`Saldo a pagar: ${formatarMoeda(saldoPagar)}`}
                fullWidth
              />
            </Stack>
          </DialogContent>
          <DialogActions sx={{ p: 2 }}>
            <Button
              onClick={() => setPagamentoAberto(false)}
              disabled={salvando}
            >
              Voltar
            </Button>
            <Button
              variant="contained"
              onClick={confirmarPagamento}
              disabled={salvando || !formaPag}
            >
              {salvando ? (
                <CircularProgress size={22} color="inherit" />
              ) : (
                "Registrar pagamento"
              )}
            </Button>
          </DialogActions>
        </Dialog>

        {/* ======================= CANCELAR ======================= */}
        <Dialog
          open={cancelando}
          onClose={() => setCancelando(false)}
          maxWidth="xs"
          fullWidth
        >
          <DialogTitle>Cancelar comanda?</DialogTitle>
          <DialogContent>
            <Typography>
              A comanda #{comanda?.numero} será cancelada. Só é possível
              cancelar comandas sem sessões realizadas e sem pagamento.
            </Typography>
          </DialogContent>
          <DialogActions sx={{ p: 2 }}>
            <Button onClick={() => setCancelando(false)}>Voltar</Button>
            <Button
              color="error"
              variant="contained"
              onClick={confirmarCancelamento}
              disabled={salvando}
            >
              Cancelar comanda
            </Button>
          </DialogActions>
        </Dialog>

        <Snackbar
          open={Boolean(aviso)}
          autoHideDuration={5000}
          onClose={() => setAviso("")}
          message={aviso}
        />
      </Box>
    </Admin>
  );
}
