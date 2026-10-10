import * as React from "react";
import Admin from "../../../components/admin";
import {
  ReadAll as ReadAgendamentos,
  Create as CriarAgendamento,
  Update as AtualizarAgendamento,
  Cancelar as CancelarAgendamento,
} from "../../../services/agenda";
import { ReadAll as ReadClientes } from "../../../services/clientes";
import { ReadAll as ReadServicos } from "../../../services/servicos";

import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  Grid,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Snackbar,
  TextField,
  Typography,
} from "@mui/material";

import AddIcon from "@mui/icons-material/Add";
import RefreshIcon from "@mui/icons-material/Refresh";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import ScheduleIcon from "@mui/icons-material/Schedule";
import EditIcon from "@mui/icons-material/Edit";
import EventBusyIcon from "@mui/icons-material/EventBusy";

const STATUS = [
  { value: "agendado", label: "Agendado" },
  { value: "confirmado", label: "Confirmado" },
  { value: "realizado", label: "Realizado" },
  { value: "faltou", label: "Faltou" },
  { value: "cancelado", label: "Cancelado" },
];

const hojeISO = () => {
  const agora = new Date();
  const ano = agora.getFullYear();
  const mes = String(agora.getMonth() + 1).padStart(2, "0");
  const dia = String(agora.getDate()).padStart(2, "0");

  return `${ano}-${mes}-${dia}`;
};

const FORMULARIO_INICIAL = () => ({
  clienteId: "",
  servicoId: "",
  data: hojeISO(),
  horario: "09:00",
  status: "agendado",
  observacoes: "",
});

const rotuloStatus = (status) =>
  STATUS.find((item) => item.value === status)?.label || status || "Agendado";

const corStatus = (status) => {
  switch (status) {
    case "confirmado":
      return "success";
    case "realizado":
      return "primary";
    case "cancelado":
    case "faltou":
      return "error";
    default:
      return "warning";
  }
};

const formatarMoeda = (valor) =>
  Number(valor || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });

const minutos = (horario) => {
  const [hora, minuto] = String(horario || "")
    .split(":")
    .map(Number);
  if (!Number.isFinite(hora) || !Number.isFinite(minuto)) return null;
  return hora * 60 + minuto;
};

const calcularHorarioFim = (horario, duracao) => {
  const inicio = minutos(horario);
  if (inicio === null || !duracao) return "";

  const fim = inicio + Number(duracao);
  if (fim >= 24 * 60) return "00:00";

  return `${String(Math.floor(fim / 60)).padStart(2, "0")}:${String(
    fim % 60,
  ).padStart(2, "0")}`;
};

export default function Agenda() {
  const [agendamentos, setAgendamentos] = React.useState([]);
  const [clientes, setClientes] = React.useState([]);
  const [servicos, setServicos] = React.useState([]);

  const [carregando, setCarregando] = React.useState(true);
  const [salvando, setSalvando] = React.useState(false);
  const [erro, setErro] = React.useState("");
  const [aviso, setAviso] = React.useState("");

  const [modalAberto, setModalAberto] = React.useState(false);
  const [agendamentoEditando, setAgendamentoEditando] = React.useState(null);
  const [agendamentoCancelar, setAgendamentoCancelar] = React.useState(null);
  const [formulario, setFormulario] = React.useState(FORMULARIO_INICIAL);

  const [filtroData, setFiltroData] = React.useState(hojeISO());
  const [filtroStatus, setFiltroStatus] = React.useState("todos");

  const carregarDados = React.useCallback(async () => {
    setCarregando(true);
    setErro("");

    try {
      const [listaAgendamentos, listaClientes, listaServicos] =
        await Promise.all([ReadAgendamentos(), ReadClientes(), ReadServicos()]);

      setAgendamentos(listaAgendamentos);
      setClientes(listaClientes);
      setServicos(listaServicos);
    } catch (error) {
      console.error("Erro ao carregar agenda:", error);

      setErro(
        error?.code === "permission-denied"
          ? "O Firebase bloqueou a leitura. Confira as regras do Firestore e a autenticação."
          : "Não foi possível carregar a agenda, os clientes ou os serviços.",
      );
    } finally {
      setCarregando(false);
    }
  }, []);

  React.useEffect(() => {
    carregarDados();
  }, [carregarDados]);

  const servicoSelecionado = servicos.find(
    (item) => item.id === formulario.servicoId,
  );

  const horarioFim = calcularHorarioFim(
    formulario.horario,
    servicoSelecionado?.duracao,
  );

  const listaFiltrada = agendamentos
    .filter((item) => !filtroData || item.data === filtroData)
    .filter((item) => filtroStatus === "todos" || item.status === filtroStatus)
    .sort((a, b) => {
      const porData = String(a.data || "").localeCompare(String(b.data || ""));
      if (porData !== 0) return porData;
      return String(a.horario || "").localeCompare(String(b.horario || ""));
    });

  const abrirNovo = () => {
    setAgendamentoEditando(null);
    setFormulario(FORMULARIO_INICIAL());
    setErro("");
    setModalAberto(true);
  };

  const abrirEdicao = (item) => {
    setAgendamentoEditando(item);
    setFormulario({
      clienteId: item.clienteId || "",
      servicoId: item.servicoId || "",
      data: item.data || hojeISO(),
      horario: item.horario || "09:00",
      status: item.status || "agendado",
      observacoes: item.observacoes || "",
    });
    setErro("");
    setModalAberto(true);
  };

  const alterarCampo = (campo, valor) => {
    setFormulario((atual) => ({
      ...atual,
      [campo]: valor,
    }));
  };

  const fecharModal = () => {
    if (salvando) return;
    setModalAberto(false);
    setAgendamentoEditando(null);
    setErro("");
  };

  const salvar = async (event) => {
    event.preventDefault();
    setErro("");

    const cliente = clientes.find((item) => item.id === formulario.clienteId);
    const servico = servicos.find((item) => item.id === formulario.servicoId);

    if (!cliente) {
      setErro("Selecione um cliente válido.");
      return;
    }

    if (!servico) {
      setErro("Selecione um serviço válido.");
      return;
    }

    if (servico.ativo === false) {
      setErro("Esse serviço está inativo. Selecione um serviço ativo.");
      return;
    }

    const dados = {
      ...formulario,
      clienteNome: cliente.nome || cliente.nomeFantasia || "",
      servicoNome: servico.nome || "",
      duracao: Number(servico.duracao),
      valor: Number(servico.valor || 0),
    };

    setSalvando(true);

    try {
      if (agendamentoEditando) {
        await AtualizarAgendamento(agendamentoEditando.id, dados);
        setAviso("Agendamento atualizado com sucesso.");
      } else {
        await CriarAgendamento(dados);
        setAviso("Agendamento cadastrado com sucesso.");
      }

      setModalAberto(false);
      setAgendamentoEditando(null);
      await carregarDados();
    } catch (error) {
      console.error("Erro ao salvar agendamento:", error);
      setErro(error.message || "Não foi possível salvar o agendamento.");
    } finally {
      setSalvando(false);
    }
  };

  const confirmarCancelamento = async () => {
    if (!agendamentoCancelar) return;

    setErro("");

    try {
      await CancelarAgendamento(agendamentoCancelar.id);
      setAgendamentoCancelar(null);
      setAviso("Agendamento cancelado. O histórico foi preservado.");
      await carregarDados();
    } catch (error) {
      console.error("Erro ao cancelar agendamento:", error);
      setErro(error.message || "Não foi possível cancelar o agendamento.");
      setAgendamentoCancelar(null);
    }
  };

  const clientesDisponiveis = clientes.filter(
    (item) => item.ativo !== false || item.id === formulario.clienteId,
  );

  const servicosDisponiveis = servicos.filter(
    (item) => item.ativo !== false || item.id === formulario.servicoId,
  );

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
              Agenda
            </Typography>
            <Typography color="text.secondary">
              Gerencie os atendimentos da Galeria da Beleza.
            </Typography>
          </Box>

          <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
            <Button
              variant="outlined"
              startIcon={<RefreshIcon />}
              onClick={carregarDados}
              disabled={carregando}
            >
              Atualizar
            </Button>

            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={abrirNovo}
            >
              Novo agendamento
            </Button>
          </Box>
        </Box>

        {erro && !modalAberto && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setErro("")}>
            {erro}
          </Alert>
        )}

        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6} md={4}>
            <Paper
              elevation={0}
              sx={{ p: 2, border: "1px solid #eee", borderRadius: 3 }}
            >
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <CalendarMonthIcon color="primary" />
                <Typography color="text.secondary">
                  Agendamentos no filtro
                </Typography>
              </Box>
              <Typography variant="h4" fontWeight={700} sx={{ mt: 1 }}>
                {carregando ? "—" : listaFiltrada.length}
              </Typography>
            </Paper>
          </Grid>

          <Grid item xs={12} sm={6} md={4}>
            <Paper
              elevation={0}
              sx={{ p: 2, border: "1px solid #eee", borderRadius: 3 }}
            >
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <ScheduleIcon color="primary" />
                <Typography color="text.secondary">
                  Confirmados no filtro
                </Typography>
              </Box>
              <Typography variant="h4" fontWeight={700} sx={{ mt: 1 }}>
                {carregando
                  ? "—"
                  : listaFiltrada.filter((item) => item.status === "confirmado")
                      .length}
              </Typography>
            </Paper>
          </Grid>

          <Grid item xs={12} sm={6} md={4}>
            <Paper
              elevation={0}
              sx={{ p: 2, border: "1px solid #eee", borderRadius: 3 }}
            >
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <EventBusyIcon color="primary" />
                <Typography color="text.secondary">
                  Cancelados no filtro
                </Typography>
              </Box>
              <Typography variant="h4" fontWeight={700} sx={{ mt: 1 }}>
                {carregando
                  ? "—"
                  : listaFiltrada.filter((item) => item.status === "cancelado")
                      .length}
              </Typography>
            </Paper>
          </Grid>
        </Grid>

        <Paper
          elevation={0}
          sx={{
            p: 2,
            mb: 2.5,
            border: "1px solid #eee",
            borderRadius: 3,
          }}
        >
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Filtrar por data"
                type="date"
                value={filtroData}
                onChange={(event) => setFiltroData(event.target.value)}
                InputLabelProps={{ shrink: true }}
                fullWidth
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel id="filtro-status-label">Status</InputLabel>
                <Select
                  labelId="filtro-status-label"
                  value={filtroStatus}
                  label="Status"
                  onChange={(event) => setFiltroStatus(event.target.value)}
                >
                  <MenuItem value="todos">Todos os status</MenuItem>
                  {STATUS.map((item) => (
                    <MenuItem key={item.value} value={item.value}>
                      {item.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12}>
              <Button
                onClick={() => {
                  setFiltroData("");
                  setFiltroStatus("todos");
                }}
              >
                Limpar filtros
              </Button>
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
            <CalendarMonthIcon
              sx={{ fontSize: 42, color: "text.disabled", mb: 1 }}
            />
            <Typography variant="h6" fontWeight={700}>
              Nenhum agendamento encontrado
            </Typography>
            <Typography color="text.secondary" sx={{ mt: 1, mb: 3 }}>
              Altere os filtros ou cadastre um novo atendimento.
            </Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={abrirNovo}
            >
              Novo agendamento
            </Button>
          </Paper>
        ) : (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
            {listaFiltrada.map((item) => {
              const cliente = clientes.find((c) => c.id === item.clienteId);
              const servico = servicos.find((s) => s.id === item.servicoId);

              const nomeCliente =
                cliente?.nome ||
                cliente?.nomeFantasia ||
                item.clienteNome ||
                "Cliente não identificado";

              const nomeServico =
                servico?.nome || item.servicoNome || "Serviço não identificado";

              return (
                <Paper
                  key={item.id}
                  elevation={0}
                  sx={{
                    p: { xs: 2, sm: 2.5 },
                    border: "1px solid #eee",
                    borderRadius: 3,
                  }}
                >
                  <Grid container spacing={2} alignItems="center">
                    <Grid item xs={12} sm={2}>
                      <Typography variant="h6" fontWeight={700}>
                        {item.horario || "--:--"}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {item.horarioFim ||
                          calcularHorarioFim(item.horario, item.duracao)}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {item.data
                          ? new Date(
                              `${item.data}T12:00:00`,
                            ).toLocaleDateString("pt-BR")
                          : "Sem data"}
                      </Typography>
                    </Grid>

                    <Grid item xs={12} sm={5}>
                      <Typography fontWeight={700}>{nomeCliente}</Typography>
                      <Typography color="text.secondary">
                        {nomeServico}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {item.duracao || servico?.duracao || "—"} minutos ·{" "}
                        {formatarMoeda(item.valor ?? servico?.valor)}
                      </Typography>
                      {item.observacoes && (
                        <Typography
                          variant="body2"
                          sx={{ mt: 0.5, whiteSpace: "pre-line" }}
                        >
                          {item.observacoes}
                        </Typography>
                      )}
                    </Grid>

                    <Grid
                      item
                      xs={12}
                      sm={2}
                      sx={{ display: "flex", justifyContent: "flex-start" }}
                    >
                      <Chip
                        label={rotuloStatus(item.status)}
                        color={corStatus(item.status)}
                        variant="outlined"
                        size="small"
                      />
                    </Grid>

                    <Grid
                      item
                      xs={12}
                      sm={3}
                      sx={{
                        display: "flex",
                        justifyContent: { xs: "flex-start", sm: "flex-end" },
                        gap: 1,
                        flexWrap: "wrap",
                      }}
                    >
                      <Button
                        size="small"
                        variant="outlined"
                        startIcon={<EditIcon />}
                        onClick={() => abrirEdicao(item)}
                      >
                        Editar
                      </Button>

                      {item.status !== "cancelado" &&
                        item.status !== "realizado" &&
                        item.status !== "faltou" && (
                          <Button
                            size="small"
                            color="error"
                            variant="text"
                            onClick={() => setAgendamentoCancelar(item)}
                          >
                            Cancelar
                          </Button>
                        )}
                    </Grid>
                  </Grid>
                </Paper>
              );
            })}
          </Box>
        )}

        <Dialog
          open={modalAberto}
          onClose={fecharModal}
          fullWidth
          maxWidth="sm"
        >
          <Box component="form" onSubmit={salvar}>
            <DialogTitle>
              {agendamentoEditando ? "Editar agendamento" : "Novo agendamento"}
            </DialogTitle>

            <DialogContent dividers>
              {erro && (
                <Alert severity="error" sx={{ mb: 2 }}>
                  {erro}
                </Alert>
              )}

              {clientesDisponiveis.length === 0 && (
                <Alert severity="warning" sx={{ mb: 2 }}>
                  Cadastre pelo menos um cliente antes de agendar.
                </Alert>
              )}

              {servicosDisponiveis.filter((item) => item.ativo !== false)
                .length === 0 && (
                <Alert severity="warning" sx={{ mb: 2 }}>
                  Cadastre ou ative um serviço antes de agendar.
                </Alert>
              )}

              <Grid container spacing={2} sx={{ pt: 0.5 }}>
                <Grid item xs={12}>
                  <FormControl fullWidth required>
                    <InputLabel id="cliente-label">Cliente</InputLabel>
                    <Select
                      labelId="cliente-label"
                      value={formulario.clienteId}
                      label="Cliente"
                      onChange={(event) =>
                        alterarCampo("clienteId", event.target.value)
                      }
                    >
                      {clientesDisponiveis.map((cliente) => (
                        <MenuItem key={cliente.id} value={cliente.id}>
                          {cliente.nome ||
                            cliente.nomeFantasia ||
                            cliente.email ||
                            cliente.id}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={12}>
                  <FormControl fullWidth required>
                    <InputLabel id="servico-label">Serviço</InputLabel>
                    <Select
                      labelId="servico-label"
                      value={formulario.servicoId}
                      label="Serviço"
                      onChange={(event) =>
                        alterarCampo("servicoId", event.target.value)
                      }
                    >
                      {servicosDisponiveis.map((servico) => (
                        <MenuItem
                          key={servico.id}
                          value={servico.id}
                          disabled={servico.ativo === false}
                        >
                          {servico.nome} — {servico.duracao || "?"} min —{" "}
                          {formatarMoeda(servico.valor)}
                          {servico.ativo === false ? " (Inativo)" : ""}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Data"
                    type="date"
                    value={formulario.data}
                    onChange={(event) =>
                      alterarCampo("data", event.target.value)
                    }
                    InputLabelProps={{ shrink: true }}
                    required
                    fullWidth
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Horário de início"
                    type="time"
                    value={formulario.horario}
                    onChange={(event) =>
                      alterarCampo("horario", event.target.value)
                    }
                    InputLabelProps={{ shrink: true }}
                    inputProps={{ step: 300 }}
                    required
                    fullWidth
                  />
                </Grid>

                <Grid item xs={12}>
                  <Alert severity="info">
                    Duração: {servicoSelecionado?.duracao || "—"} minutos.{" "}
                    Horário estimado de término: {horarioFim || "—"}.
                  </Alert>
                </Grid>

                <Grid item xs={12}>
                  <FormControl fullWidth required>
                    <InputLabel id="status-label">Status</InputLabel>
                    <Select
                      labelId="status-label"
                      value={formulario.status}
                      label="Status"
                      onChange={(event) =>
                        alterarCampo("status", event.target.value)
                      }
                    >
                      {STATUS.map((item) => (
                        <MenuItem key={item.value} value={item.value}>
                          {item.label}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={12}>
                  <TextField
                    label="Observações"
                    value={formulario.observacoes}
                    onChange={(event) =>
                      alterarCampo("observacoes", event.target.value)
                    }
                    fullWidth
                    multiline
                    minRows={3}
                  />
                </Grid>
              </Grid>
            </DialogContent>

            <DialogActions sx={{ p: 2 }}>
              <Button onClick={fecharModal} disabled={salvando}>
                Cancelar
              </Button>

              <Button
                type="submit"
                variant="contained"
                disabled={
                  salvando ||
                  clientesDisponiveis.length === 0 ||
                  !servicosDisponiveis.some(
                    (item) =>
                      item.id === formulario.servicoId && item.ativo !== false,
                  )
                }
              >
                {salvando ? (
                  <CircularProgress size={22} color="inherit" />
                ) : agendamentoEditando ? (
                  "Salvar alterações"
                ) : (
                  "Cadastrar agendamento"
                )}
              </Button>
            </DialogActions>
          </Box>
        </Dialog>

        <Dialog
          open={Boolean(agendamentoCancelar)}
          onClose={() => setAgendamentoCancelar(null)}
          maxWidth="xs"
          fullWidth
        >
          <DialogTitle>Cancelar atendimento?</DialogTitle>
          <DialogContent>
            <Typography>
              O agendamento de{" "}
              <strong>
                {agendamentoCancelar?.clienteNome || "este cliente"}
              </strong>{" "}
              será marcado como cancelado. O registro continuará no histórico.
            </Typography>
          </DialogContent>
          <DialogActions sx={{ p: 2 }}>
            <Button onClick={() => setAgendamentoCancelar(null)}>Voltar</Button>
            <Button
              color="error"
              variant="contained"
              onClick={confirmarCancelamento}
            >
              Confirmar cancelamento
            </Button>
          </DialogActions>
        </Dialog>

        <Snackbar
          open={Boolean(aviso)}
          autoHideDuration={4000}
          onClose={() => setAviso("")}
          message={aviso}
        />
      </Box>
    </Admin>
  );
}
