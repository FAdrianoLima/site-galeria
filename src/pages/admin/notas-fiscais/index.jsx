import * as React from "react";
import Admin from "../../../components/admin";
import { db } from "../../../../firebase-config";

import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  serverTimestamp,
} from "firebase/firestore";
import { auth } from "../../../../firebase-config";
import { onAuthStateChanged } from "firebase/auth";

import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Grid,
  IconButton,
  MenuItem,
  Snackbar,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
  InputAdornment,
} from "@mui/material";

import ReceiptLongIcon from "@mui/icons-material/ReceiptLong";
import AddIcon from "@mui/icons-material/Add";
import SearchIcon from "@mui/icons-material/Search";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import DescriptionOutlinedIcon from "@mui/icons-material/DescriptionOutlined";
import AccountBalanceOutlinedIcon from "@mui/icons-material/AccountBalanceOutlined";
import HourglassEmptyIcon from "@mui/icons-material/HourglassEmpty";

const initialForm = {
  clienteId: "",
  descricao: "",
  valor: "",
  dataCompetencia: new Date().toISOString().slice(0, 10),
  observacoes: "",
};

function formatarMoeda(valor) {
  return Number(valor || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function formatarData(data) {
  if (!data) return "—";

  const partes = String(data).split("-");
  if (partes.length !== 3) return data;

  return `${partes[2]}/${partes[1]}/${partes[0]}`;
}

function obterNomeCliente(cliente) {
  return (
    cliente?.nome ||
    cliente?.nomeFantasia ||
    cliente?.razaoSocial ||
    "Cliente sem nome"
  );
}

function montarTomadorNfse(cliente) {
  const documento = String(
    cliente.cpfCnpj || cliente.cpf || cliente.cnpj || "",
  ).replace(/\D/g, "");

  const tomador = {
    nome: obterNomeCliente(cliente),
    email: cliente.email || "",
    telefone: String(cliente.telefone || cliente.whatsapp || "").replace(
      /\D/g,
      "",
    ),
    endereco: {
      logradouro: cliente.endereco || "",
      numero: String(cliente.numero || ""),
      complemento: cliente.complemento || "",
      bairro: cliente.bairro || "",
      cidade: cliente.cidade || "",
      uf: cliente.estado || "",
      cep: String(cliente.cep || "").replace(/\D/g, ""),
    },
  };

  if (documento.length === 11) {
    tomador.cpf = documento;
  } else if (documento.length === 14) {
    tomador.cnpj = documento;
  } else {
    throw new Error("O cliente precisa ter um CPF ou CNPJ válido.");
  }

  return tomador;
}

export default function NotasFiscais() {
  const [notas, setNotas] = React.useState([]);
  const [clientes, setClientes] = React.useState([]);
  const [busca, setBusca] = React.useState("");
  const [carregando, setCarregando] = React.useState(true);
  const [salvando, setSalvando] = React.useState(false);
  const [modalAberto, setModalAberto] = React.useState(false);
  const [notaSelecionada, setNotaSelecionada] = React.useState(null);
  const [form, setForm] = React.useState(initialForm);
  const [mensagem, setMensagem] = React.useState({
    aberta: false,
    texto: "",
    tipo: "success",
  });

  const [diagnosticoNfse, setDiagnosticoNfse] = React.useState({
    carregando: true,
    erro: "",
    configuracao: null,
    integracao: null,
  });

  const carregarDados = React.useCallback(async () => {
    setCarregando(true);

    try {
      const [notasSnapshot, clientesSnapshot] = await Promise.all([
        getDocs(collection(db, "notasFiscais")),
        getDocs(collection(db, "clientes")),
      ]);

      const notasCarregadas = notasSnapshot.docs.map((item) => ({
        id: item.id,
        ...item.data(),
      }));

      notasCarregadas.sort((a, b) => {
        const dataA = a.criadoEm?.toMillis?.() || 0;
        const dataB = b.criadoEm?.toMillis?.() || 0;
        return dataB - dataA;
      });

      setNotas(notasCarregadas);

      setClientes(
        clientesSnapshot.docs.map((item) => ({
          id: item.id,
          ...item.data(),
        })),
      );
    } catch (erro) {
      console.error("Erro ao carregar notas fiscais:", erro);

      setMensagem({
        aberta: true,
        texto:
          "Não foi possível carregar os dados. Verifique a conexão e as regras do Firebase.",
        tipo: "error",
      });
    } finally {
      setCarregando(false);
    }
  }, []);

  const consultarDiagnosticoNfse = React.useCallback(async (usuario) => {
    setDiagnosticoNfse({
      carregando: true,
      erro: "",
      configuracao: null,
      integracao: null,
    });

    try {
      if (!usuario) {
        throw new Error("Faça login para consultar a configuração fiscal.");
      }

      const token = await usuario.getIdToken();

      const resposta = await fetch("/.netlify/functions/nfse-status", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        cache: "no-store",
      });

      const resultado = await resposta.json();

      if (!resposta.ok) {
        throw new Error(
          resultado.erro || "Não foi possível consultar o diagnóstico fiscal.",
        );
      }

      setDiagnosticoNfse({
        carregando: false,
        erro: "",
        configuracao: resultado.configuracao || null,
        integracao: resultado.integracao || null,
      });
    } catch (erro) {
      console.error("Erro no diagnóstico NFS-e:", erro);

      setDiagnosticoNfse({
        carregando: false,
        erro: erro.message || "Falha ao consultar a configuração fiscal.",
        configuracao: null,
        integracao: null,
      });
    }
  }, []);

  React.useEffect(() => {
    const cancelarObservacao = onAuthStateChanged(auth, (usuario) => {
      if (usuario) {
        consultarDiagnosticoNfse(usuario);
      } else {
        setDiagnosticoNfse({
          carregando: false,
          erro: "Nenhum usuário autenticado no Firebase.",
          configuracao: null,
          integracao: null,
        });
      }
    });

    return () => cancelarObservacao();
  }, [consultarDiagnosticoNfse]);

  React.useEffect(() => {
    carregarDados();
  }, [carregarDados]);

  const abrirNovoRascunho = () => {
    setForm({
      ...initialForm,
      dataCompetencia: new Date().toISOString().slice(0, 10),
    });

    setNotaSelecionada(null);
    setModalAberto(true);
  };

  const abrirDetalhes = (nota) => {
    setNotaSelecionada(nota);
    setForm({
      clienteId: nota.clienteId || "",
      descricao: nota.descricao || "",
      valor: String(nota.valor ?? ""),
      dataCompetencia:
        nota.dataCompetencia || new Date().toISOString().slice(0, 10),
      observacoes: nota.observacoes || "",
    });

    setModalAberto(true);
  };

  const fecharModal = () => {
    if (salvando) return;

    setModalAberto(false);
    setNotaSelecionada(null);
  };

  const atualizarCampo = (campo, valor) => {
    setForm((atual) => ({
      ...atual,
      [campo]: valor,
    }));
  };

  const salvarRascunho = async () => {
    if (!form.clienteId) {
      setMensagem({
        aberta: true,
        texto: "Selecione um cliente.",
        tipo: "warning",
      });
      return;
    }

    if (!form.descricao.trim()) {
      setMensagem({
        aberta: true,
        texto: "Informe a descrição do serviço.",
        tipo: "warning",
      });
      return;
    }

    const valor = Number(String(form.valor).replace(",", "."));

    if (!Number.isFinite(valor) || valor <= 0) {
      setMensagem({
        aberta: true,
        texto: "Informe um valor válido, maior que zero.",
        tipo: "warning",
      });
      return;
    }

    if (!form.dataCompetencia) {
      setMensagem({
        aberta: true,
        texto: "Informe a data de competência.",
        tipo: "warning",
      });
      return;
    }

    const cliente = clientes.find((item) => item.id === form.clienteId);

    if (!cliente) {
      setMensagem({
        aberta: true,
        texto: "O cliente selecionado não foi encontrado.",
        tipo: "error",
      });
      return;
    }

    setSalvando(true);

    try {
      const dados = {
        clienteId: cliente.id,
        clienteNome: obterNomeCliente(cliente),
        clienteDocumento: cliente.cpfCnpj || cliente.cpf || cliente.cnpj || "",
        descricao: form.descricao.trim(),
        valor,
        dataCompetencia: form.dataCompetencia,
        observacoes: form.observacoes.trim(),
        status: "rascunho",
        tipo: "nfse",
        atualizadoEm: serverTimestamp(),
      };

      if (notaSelecionada) {
        // Esta primeira versão mantém os rascunhos imutáveis após a
        // criação. Para editar, exclua o rascunho e crie outro.
        setMensagem({
          aberta: true,
          texto:
            "A edição de rascunhos existentes será habilitada na próxima etapa. Crie um novo rascunho para alterar os dados.",
          tipo: "info",
        });
        return;
      }

      await addDoc(collection(db, "notasFiscais"), {
        ...dados,
        criadoEm: serverTimestamp(),
        numeroNota: null,
        codigoVerificacao: null,
        protocolo: null,
        emitidaEm: null,
        ambiente: "nao_configurado",
      });

      setModalAberto(false);
      setForm(initialForm);

      setMensagem({
        aberta: true,
        texto: "Rascunho salvo com sucesso.",
        tipo: "success",
      });

      await carregarDados();
    } catch (erro) {
      console.error("Erro ao salvar rascunho:", erro);

      setMensagem({
        aberta: true,
        texto: "Não foi possível salvar o rascunho no Firebase.",
        tipo: "error",
      });
    } finally {
      setSalvando(false);
    }
  };

  const excluirRascunho = async (nota) => {
    if (nota.status !== "rascunho") {
      setMensagem({
        aberta: true,
        texto: "Somente rascunhos podem ser excluídos por esta tela.",
        tipo: "warning",
      });
      return;
    }

    const confirmar = window.confirm(
      `Deseja excluir o rascunho de ${nota.clienteNome || "cliente"}?`,
    );

    if (!confirmar) return;

    try {
      await deleteDoc(doc(db, "notasFiscais", nota.id));

      setNotas((atuais) => atuais.filter((item) => item.id !== nota.id));

      setMensagem({
        aberta: true,
        texto: "Rascunho excluído.",
        tipo: "success",
      });
    } catch (erro) {
      console.error("Erro ao excluir rascunho:", erro);

      setMensagem({
        aberta: true,
        texto: "Não foi possível excluir o rascunho.",
        tipo: "error",
      });
    }
  };

  const notasFiltradas = notas.filter((nota) => {
    const termo = busca.trim().toLowerCase();

    if (!termo) return true;

    return [
      nota.clienteNome,
      nota.clienteDocumento,
      nota.descricao,
      nota.status,
    ].some((valor) =>
      String(valor || "")
        .toLowerCase()
        .includes(termo),
    );
  });

  const totalRascunhos = notas.filter(
    (nota) => nota.status === "rascunho",
  ).length;

  const totalRegistrado = notas.reduce(
    (total, nota) => total + Number(nota.valor || 0),
    0,
  );

  const totalEmitidas = notas.filter(
    (nota) => nota.status === "emitida",
  ).length;

  const cardSx = {
    height: "100%",
    border: "1px solid #EAE6F0",
    borderRadius: "16px",
    boxShadow: "0 3px 12px rgba(35, 20, 60, 0.035)",
  };

  return (
    <Admin>
      <Box sx={{ pb: 4 }}>
        <Stack
          direction={{ xs: "column", sm: "row" }}
          justifyContent="space-between"
          alignItems={{ xs: "stretch", sm: "center" }}
          spacing={2}
          sx={{ mb: 3 }}
        >
          <Box>
            <Typography variant="h5" fontWeight={700} sx={{ color: "#302641" }}>
              Notas fiscais
            </Typography>

            <Typography color="text.secondary" sx={{ mt: 0.5 }}>
              Organize os dados das notas de serviço da clínica.
            </Typography>
          </Box>

          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={abrirNovoRascunho}
            sx={{
              borderRadius: "10px",
              px: 2.5,
              py: 1.2,
              alignSelf: { xs: "flex-start", sm: "center" },
              textTransform: "none",
              fontWeight: 600,
              boxShadow: "none",
            }}
          >
            Novo rascunho
          </Button>
        </Stack>

        <Alert severity="info" sx={{ mb: 3, borderRadius: 2 }}>
          Esta área registra apenas rascunhos internos. Nenhuma nota fiscal é
          emitida ou autorizada pelo sistema nesta etapa.
        </Alert>

        <Card sx={{ ...cardSx, mb: 3 }}>
          <CardContent>
            <Stack spacing={2}>
              <Typography variant="h6" fontWeight={700}>
                Integração fiscal
              </Typography>

              {diagnosticoNfse.carregando ? (
                <Stack direction="row" spacing={1.5} alignItems="center">
                  <CircularProgress size={20} />
                  <Typography color="text.secondary">
                    Consultando configuração fiscal...
                  </Typography>
                </Stack>
              ) : diagnosticoNfse.erro ? (
                <Alert severity="error">{diagnosticoNfse.erro}</Alert>
              ) : (
                <>
                  <Alert severity="warning">
                    {diagnosticoNfse.integracao?.mensagem ||
                      "A comunicação com a API fiscal ainda não foi validada."}
                  </Alert>

                  <Stack
                    direction={{ xs: "column", sm: "row" }}
                    spacing={1}
                    flexWrap="wrap"
                  >
                    <Chip
                      label={`Ambiente: ${
                        diagnosticoNfse.configuracao?.ambiente ||
                        "não configurado"
                      }`}
                      variant="outlined"
                    />

                    <Chip
                      label={
                        diagnosticoNfse.configuracao?.cnpjConfigurado
                          ? "CNPJ configurado"
                          : "CNPJ pendente"
                      }
                      color={
                        diagnosticoNfse.configuracao?.cnpjConfigurado
                          ? "success"
                          : "warning"
                      }
                      variant="outlined"
                    />

                    <Chip
                      label={
                        diagnosticoNfse.integracao?.conectada
                          ? "API conectada"
                          : "API não conectada"
                      }
                      color={
                        diagnosticoNfse.integracao?.conectada
                          ? "success"
                          : "default"
                      }
                      variant="outlined"
                    />
                  </Stack>

                  <Button
                    variant="outlined"
                    onClick={() => consultarDiagnosticoNfse(auth.currentUser)}
                    disabled={!auth.currentUser}
                    sx={{ alignSelf: "flex-start", textTransform: "none" }}
                  >
                    Atualizar diagnóstico
                  </Button>
                </>
              )}
            </Stack>
          </CardContent>
        </Card>

        <Grid container spacing={2.5} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6} lg={4}>
            <Card sx={cardSx}>
              <CardContent>
                <Stack direction="row" spacing={2} alignItems="center">
                  <Box
                    sx={{
                      p: 1.5,
                      borderRadius: "12px",
                      bgcolor: "#F0E9FF",
                      color: "#8B5CF6",
                    }}
                  >
                    <DescriptionOutlinedIcon />
                  </Box>

                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      Rascunhos
                    </Typography>
                    <Typography variant="h5" fontWeight={700}>
                      {totalRascunhos}
                    </Typography>
                  </Box>
                </Stack>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} lg={4}>
            <Card sx={cardSx}>
              <CardContent>
                <Stack direction="row" spacing={2} alignItems="center">
                  <Box
                    sx={{
                      p: 1.5,
                      borderRadius: "12px",
                      bgcolor: "#FFF3E0",
                      color: "#ED8A19",
                    }}
                  >
                    <HourglassEmptyIcon />
                  </Box>

                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      Total em rascunhos
                    </Typography>
                    <Typography variant="h5" fontWeight={700}>
                      {formatarMoeda(totalRegistrado)}
                    </Typography>
                  </Box>
                </Stack>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} lg={4}>
            <Card sx={cardSx}>
              <CardContent>
                <Stack direction="row" spacing={2} alignItems="center">
                  <Box
                    sx={{
                      p: 1.5,
                      borderRadius: "12px",
                      bgcolor: "#E8F5E9",
                      color: "#2E7D32",
                    }}
                  >
                    <AccountBalanceOutlinedIcon />
                  </Box>

                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      Emitidas oficialmente
                    </Typography>
                    <Typography variant="h5" fontWeight={700}>
                      {totalEmitidas}
                    </Typography>
                  </Box>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        <Card sx={cardSx}>
          <CardContent sx={{ p: { xs: 2, md: 3 } }}>
            <Stack
              direction={{ xs: "column", sm: "row" }}
              justifyContent="space-between"
              alignItems={{ xs: "stretch", sm: "center" }}
              spacing={2}
              sx={{ mb: 2.5 }}
            >
              <Box>
                <Typography variant="h6" fontWeight={700}>
                  Registros
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Rascunhos e histórico de notas fiscais.
                </Typography>
              </Box>

              <TextField
                size="small"
                placeholder="Buscar cliente ou serviço..."
                value={busca}
                onChange={(event) => setBusca(event.target.value)}
                sx={{ width: { xs: "100%", sm: 310 } }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon color="action" />
                    </InputAdornment>
                  ),
                }}
              />
            </Stack>

            <Divider sx={{ mb: 2 }} />

            {carregando ? (
              <Box sx={{ py: 7, textAlign: "center" }}>
                <CircularProgress size={30} />
                <Typography color="text.secondary" sx={{ mt: 2 }}>
                  Carregando registros...
                </Typography>
              </Box>
            ) : notasFiltradas.length === 0 ? (
              <Box sx={{ py: 7, textAlign: "center" }}>
                <ReceiptLongIcon
                  sx={{ fontSize: 48, color: "#C8C0D5", mb: 1 }}
                />

                <Typography fontWeight={600}>
                  {busca
                    ? "Nenhum registro encontrado"
                    : "Nenhum rascunho cadastrado"}
                </Typography>

                <Typography
                  color="text.secondary"
                  variant="body2"
                  sx={{ mt: 0.5, mb: 2 }}
                >
                  {busca
                    ? "Tente buscar por outro termo."
                    : "Crie o primeiro rascunho para começar."}
                </Typography>

                {!busca && (
                  <Button
                    variant="outlined"
                    startIcon={<AddIcon />}
                    onClick={abrirNovoRascunho}
                    sx={{ textTransform: "none" }}
                  >
                    Criar rascunho
                  </Button>
                )}
              </Box>
            ) : (
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Cliente</TableCell>
                      <TableCell>Serviço</TableCell>
                      <TableCell>Competência</TableCell>
                      <TableCell>Valor</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell align="right">Ações</TableCell>
                    </TableRow>
                  </TableHead>

                  <TableBody>
                    {notasFiltradas.map((nota) => (
                      <TableRow key={nota.id} hover>
                        <TableCell>
                          <Typography fontWeight={600} variant="body2">
                            {nota.clienteNome || "Cliente não informado"}
                          </Typography>

                          {nota.clienteDocumento && (
                            <Typography
                              variant="caption"
                              color="text.secondary"
                            >
                              {nota.clienteDocumento}
                            </Typography>
                          )}
                        </TableCell>

                        <TableCell sx={{ minWidth: 180, maxWidth: 280 }}>
                          <Typography
                            variant="body2"
                            sx={{
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              display: "-webkit-box",
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: "vertical",
                            }}
                          >
                            {nota.descricao || "—"}
                          </Typography>
                        </TableCell>

                        <TableCell>
                          {formatarData(nota.dataCompetencia)}
                        </TableCell>

                        <TableCell sx={{ whiteSpace: "nowrap" }}>
                          {formatarMoeda(nota.valor)}
                        </TableCell>

                        <TableCell>
                          <Chip
                            size="small"
                            label={
                              nota.status === "emitida"
                                ? "Emitida"
                                : nota.status === "cancelada"
                                  ? "Cancelada"
                                  : "Rascunho"
                            }
                            color={
                              nota.status === "emitida"
                                ? "success"
                                : nota.status === "cancelada"
                                  ? "default"
                                  : "warning"
                            }
                            variant="outlined"
                          />
                        </TableCell>

                        <TableCell align="right">
                          <Stack
                            direction="row"
                            justifyContent="flex-end"
                            spacing={0.5}
                          >
                            <IconButton
                              size="small"
                              aria-label="Visualizar rascunho"
                              title="Visualizar dados"
                              onClick={() => abrirDetalhes(nota)}
                            >
                              <VisibilityOutlinedIcon fontSize="small" />
                            </IconButton>

                            {nota.status === "rascunho" && (
                              <IconButton
                                size="small"
                                aria-label="Excluir rascunho"
                                title="Excluir rascunho"
                                color="error"
                                onClick={() => excluirRascunho(nota)}
                              >
                                <DeleteOutlineIcon fontSize="small" />
                              </IconButton>
                            )}
                          </Stack>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </CardContent>
        </Card>
      </Box>

      <Dialog open={modalAberto} onClose={fecharModal} fullWidth maxWidth="sm">
        <DialogTitle sx={{ fontWeight: 700 }}>
          {notaSelecionada ? "Dados do rascunho" : "Novo rascunho"}
        </DialogTitle>

        <DialogContent dividers>
          <Stack spacing={2.5} sx={{ pt: 1 }}>
            <Alert severity="info">
              O cadastro abaixo é interno e não gera uma nota fiscal oficial.
            </Alert>

            <TextField
              select
              label="Cliente"
              value={form.clienteId}
              onChange={(event) =>
                atualizarCampo("clienteId", event.target.value)
              }
              required
              fullWidth
              disabled={Boolean(notaSelecionada)}
              helperText={
                clientes.length === 0
                  ? "Nenhum cliente encontrado. Cadastre um cliente primeiro."
                  : ""
              }
            >
              {clientes.map((cliente) => (
                <MenuItem key={cliente.id} value={cliente.id}>
                  {obterNomeCliente(cliente)}
                  {cliente.cpfCnpj || cliente.cpf || cliente.cnpj
                    ? ` — ${cliente.cpfCnpj || cliente.cpf || cliente.cnpj}`
                    : ""}
                </MenuItem>
              ))}
            </TextField>

            <TextField
              label="Descrição do serviço"
              value={form.descricao}
              onChange={(event) =>
                atualizarCampo("descricao", event.target.value)
              }
              required
              fullWidth
              multiline
              minRows={2}
              disabled={Boolean(notaSelecionada)}
              placeholder="Descreva o serviço prestado"
            />

            <TextField
              label="Valor do serviço (R$)"
              value={form.valor}
              onChange={(event) => atualizarCampo("valor", event.target.value)}
              required
              fullWidth
              disabled={Boolean(notaSelecionada)}
              inputProps={{ inputMode: "decimal" }}
              placeholder="0,00"
            />

            <TextField
              label="Data de competência"
              type="date"
              value={form.dataCompetencia}
              onChange={(event) =>
                atualizarCampo("dataCompetencia", event.target.value)
              }
              required
              fullWidth
              disabled={Boolean(notaSelecionada)}
              InputLabelProps={{ shrink: true }}
            />

            <TextField
              label="Observações internas"
              value={form.observacoes}
              onChange={(event) =>
                atualizarCampo("observacoes", event.target.value)
              }
              fullWidth
              multiline
              minRows={2}
              disabled={Boolean(notaSelecionada)}
              placeholder="Informações para conferência antes da emissão"
            />

            {notaSelecionada && (
              <Alert severity="warning">
                Este rascunho está em modo de visualização. A edição será
                habilitada em uma próxima etapa.
              </Alert>
            )}
          </Stack>
        </DialogContent>

        <DialogActions sx={{ p: 2 }}>
          <Button
            onClick={fecharModal}
            color="inherit"
            sx={{ textTransform: "none" }}
          >
            Fechar
          </Button>

          {!notaSelecionada && (
            <Button
              variant="contained"
              onClick={salvarRascunho}
              disabled={salvando || clientes.length === 0}
              sx={{ textTransform: "none", boxShadow: "none" }}
            >
              {salvando ? (
                <CircularProgress size={22} color="inherit" />
              ) : (
                "Salvar rascunho"
              )}
            </Button>
          )}
        </DialogActions>
      </Dialog>

      <Snackbar
        open={mensagem.aberta}
        autoHideDuration={5000}
        onClose={() => setMensagem((atual) => ({ ...atual, aberta: false }))}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      >
        <Alert
          severity={mensagem.tipo}
          variant="filled"
          onClose={() => setMensagem((atual) => ({ ...atual, aberta: false }))}
        >
          {mensagem.texto}
        </Alert>
      </Snackbar>
    </Admin>
  );
}
