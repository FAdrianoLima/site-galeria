import React from "react";
import Head from "next/head";
import Admin from "../../../components/admin";
import { ReadAll as ReadAgendamentos } from "../../../services/agenda";

import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  FormControl,
  Grid,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";

import AssessmentIcon from "@mui/icons-material/Assessment";
import PictureAsPdfIcon from "@mui/icons-material/PictureAsPdf";
import RefreshIcon from "@mui/icons-material/Refresh";
import AttachMoneyIcon from "@mui/icons-material/AttachMoney";
import EventAvailableIcon from "@mui/icons-material/EventAvailable";
import PeopleAltIcon from "@mui/icons-material/PeopleAlt";
import ScheduleIcon from "@mui/icons-material/Schedule";

const STATUS = [
  { value: "agendado", label: "Agendado", color: "warning" },
  { value: "confirmado", label: "Confirmado", color: "success" },
  { value: "realizado", label: "Realizado", color: "primary" },
  { value: "faltou", label: "Faltou", color: "error" },
  { value: "cancelado", label: "Cancelado", color: "default" },
];

const hojeISO = () => {
  const agora = new Date();
  const ano = agora.getFullYear();
  const mes = String(agora.getMonth() + 1).padStart(2, "0");
  const dia = String(agora.getDate()).padStart(2, "0");

  return `${ano}-${mes}-${dia}`;
};

const primeiroDiaMes = () => {
  const agora = new Date();
  return `${agora.getFullYear()}-${String(agora.getMonth() + 1).padStart(
    2,
    "0",
  )}-01`;
};

const formatarMoeda = (valor) =>
  Number(valor || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });

const formatarData = (data) => {
  if (!data) return "-";

  const [ano, mes, dia] = String(data).split("-");
  if (!ano || !mes || !dia) return data;

  return `${dia}/${mes}/${ano}`;
};

const formatarNumero = (valor) => Number(valor || 0).toLocaleString("pt-BR");

const rotuloStatus = (status) =>
  STATUS.find((item) => item.value === status)?.label || status || "Agendado";

const corStatus = (status) =>
  STATUS.find((item) => item.value === status)?.color || "default";

const normalizarValor = (valor) => {
  const numero = Number(valor);
  return Number.isFinite(numero) ? numero : 0;
};

const obterNomeServico = (item) => item.servicoNome || "Serviço não informado";
const obterNomeCliente = (item) => item.clienteNome || "Cliente não informado";

function Indicador({ titulo, valor, descricao, icone, destaque = false }) {
  return (
    <Card
      sx={{
        height: "100%",
        border: destaque ? "1px solid" : "1px solid",
        borderColor: destaque ? "primary.main" : "divider",
      }}
    >
      <CardContent>
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="space-between"
          spacing={2}
        >
          <Box>
            <Typography color="text.secondary" variant="body2">
              {titulo}
            </Typography>

            <Typography variant="h5" fontWeight={700} sx={{ mt: 1 }}>
              {valor}
            </Typography>

            {descricao && (
              <Typography
                variant="caption"
                color="text.secondary"
                display="block"
                sx={{ mt: 0.5 }}
              >
                {descricao}
              </Typography>
            )}
          </Box>

          <Box
            sx={{
              width: 44,
              height: 44,
              borderRadius: 2,
              bgcolor: "action.hover",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "primary.main",
              flexShrink: 0,
            }}
          >
            {icone}
          </Box>
        </Stack>
      </CardContent>
    </Card>
  );
}

function BarraIndicador({ valor, maximo, cor = "primary.main" }) {
  const percentual =
    maximo > 0 ? Math.max(0, Math.min(100, (valor / maximo) * 100)) : 0;

  return (
    <Box
      sx={{
        width: "100%",
        height: 9,
        bgcolor: "action.hover",
        borderRadius: 10,
        overflow: "hidden",
      }}
    >
      <Box
        sx={{
          width: `${percentual}%`,
          height: "100%",
          bgcolor: cor,
          borderRadius: 10,
          transition: "width .3s ease",
        }}
      />
    </Box>
  );
}

export default function Relatorios() {
  const [agendamentos, setAgendamentos] = React.useState([]);
  const [carregando, setCarregando] = React.useState(true);
  const [erro, setErro] = React.useState("");

  const [dataInicio, setDataInicio] = React.useState(primeiroDiaMes());
  const [dataFim, setDataFim] = React.useState(hojeISO());
  const [filtroServico, setFiltroServico] = React.useState("todos");
  const [filtroStatus, setFiltroStatus] = React.useState("todos");

  const carregarDados = React.useCallback(async () => {
    setCarregando(true);
    setErro("");

    try {
      const retorno = await ReadAgendamentos();
      setAgendamentos(Array.isArray(retorno) ? retorno : []);
    } catch (error) {
      console.error("Erro ao carregar relatórios:", error);

      setErro(
        error?.code === "permission-denied"
          ? "O Firebase bloqueou a leitura dos agendamentos. Confira as regras do Firestore e a autenticação."
          : "Não foi possível carregar os dados dos relatórios.",
      );
    } finally {
      setCarregando(false);
    }
  }, []);

  React.useEffect(() => {
    carregarDados();
  }, [carregarDados]);

  const servicosDisponiveis = React.useMemo(() => {
    const mapa = new Map();

    agendamentos.forEach((item) => {
      if (!item.servicoId) return;

      mapa.set(item.servicoId, obterNomeServico(item));
    });

    return Array.from(mapa.entries())
      .map(([id, nome]) => ({ id, nome }))
      .sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"));
  }, [agendamentos]);

  const dadosFiltrados = React.useMemo(() => {
    return agendamentos.filter((item) => {
      if (dataInicio && (!item.data || item.data < dataInicio)) return false;
      if (dataFim && (!item.data || item.data > dataFim)) return false;

      if (filtroServico !== "todos" && item.servicoId !== filtroServico) {
        return false;
      }

      if (filtroStatus !== "todos" && item.status !== filtroStatus) {
        return false;
      }

      return true;
    });
  }, [agendamentos, dataInicio, dataFim, filtroServico, filtroStatus]);

  const realizados = React.useMemo(
    () => dadosFiltrados.filter((item) => item.status === "realizado"),
    [dadosFiltrados],
  );

  const indicadores = React.useMemo(() => {
    const faturamento = realizados.reduce(
      (total, item) => total + normalizarValor(item.valor),
      0,
    );

    const quantidadeRealizados = realizados.length;

    const clientesUnicos = new Set(
      realizados.map((item) => item.clienteId).filter(Boolean),
    ).size;

    const minutosAtendidos = realizados.reduce(
      (total, item) => total + normalizarValor(item.duracao),
      0,
    );

    const quantidadeFaltas = dadosFiltrados.filter(
      (item) => item.status === "faltou",
    ).length;

    const quantidadeCancelados = dadosFiltrados.filter(
      (item) => item.status === "cancelado",
    ).length;

    const quantidadeAgendados = dadosFiltrados.filter(
      (item) => item.status === "agendado",
    ).length;

    const quantidadeConfirmados = dadosFiltrados.filter(
      (item) => item.status === "confirmado",
    ).length;

    return {
      faturamento,
      quantidadeRealizados,
      clientesUnicos,
      minutosAtendidos,
      ticketMedio:
        quantidadeRealizados > 0 ? faturamento / quantidadeRealizados : 0,
      quantidadeFaltas,
      quantidadeCancelados,
      quantidadeAgendados,
      quantidadeConfirmados,
    };
  }, [dadosFiltrados, realizados]);

  const rankingServicos = React.useMemo(() => {
    const mapa = new Map();

    realizados.forEach((item) => {
      const id = item.servicoId || "sem-servico";

      if (!mapa.has(id)) {
        mapa.set(id, {
          id,
          nome: obterNomeServico(item),
          quantidade: 0,
          faturamento: 0,
          duracao: 0,
        });
      }

      const registro = mapa.get(id);
      registro.quantidade += 1;
      registro.faturamento += normalizarValor(item.valor);
      registro.duracao += normalizarValor(item.duracao);
    });

    return Array.from(mapa.values()).sort(
      (a, b) => b.faturamento - a.faturamento,
    );
  }, [realizados]);

  const evolucaoDiaria = React.useMemo(() => {
    const mapa = new Map();

    realizados.forEach((item) => {
      const data = item.data;
      if (!data) return;

      if (!mapa.has(data)) {
        mapa.set(data, {
          data,
          quantidade: 0,
          faturamento: 0,
        });
      }

      const registro = mapa.get(data);
      registro.quantidade += 1;
      registro.faturamento += normalizarValor(item.valor);
    });

    return Array.from(mapa.values()).sort((a, b) =>
      a.data.localeCompare(b.data),
    );
  }, [realizados]);

  const rankingClientes = React.useMemo(() => {
    const mapa = new Map();

    realizados.forEach((item) => {
      const id = item.clienteId || "sem-cliente";

      if (!mapa.has(id)) {
        mapa.set(id, {
          id,
          nome: obterNomeCliente(item),
          quantidade: 0,
          faturamento: 0,
        });
      }

      const registro = mapa.get(id);
      registro.quantidade += 1;
      registro.faturamento += normalizarValor(item.valor);
    });

    return Array.from(mapa.values()).sort(
      (a, b) => b.quantidade - a.quantidade,
    );
  }, [realizados]);

  const distribuicaoStatus = React.useMemo(() => {
    return STATUS.map((status) => ({
      ...status,
      quantidade: dadosFiltrados.filter((item) => item.status === status.value)
        .length,
    }));
  }, [dadosFiltrados]);

  const maiorFaturamentoDiario = Math.max(
    0,
    ...evolucaoDiaria.map((item) => item.faturamento),
  );

  const maiorFaturamentoServico = Math.max(
    0,
    ...rankingServicos.map((item) => item.faturamento),
  );

  const maiorQuantidadeCliente = Math.max(
    0,
    ...rankingClientes.map((item) => item.quantidade),
  );

  const periodoValido = !dataInicio || !dataFim || dataInicio <= dataFim;

  const nomePeriodo = () => {
    if (!dataInicio && !dataFim) return "Todo o período";
    if (dataInicio && dataFim) {
      return `${formatarData(dataInicio)} até ${formatarData(dataFim)}`;
    }
    if (dataInicio) return `A partir de ${formatarData(dataInicio)}`;
    return `Até ${formatarData(dataFim)}`;
  };

  const nomeServicoFiltro =
    filtroServico === "todos"
      ? "Todos os serviços"
      : servicosDisponiveis.find((item) => item.id === filtroServico)?.nome ||
        "Serviço selecionado";

  const nomeStatusFiltro =
    filtroStatus === "todos" ? "Todos os status" : rotuloStatus(filtroStatus);

  const exportarPDF = () => {
    if (!periodoValido) {
      setErro("A data inicial não pode ser posterior à data final.");
      return;
    }

    window.print();
  };

  const limparFiltros = () => {
    setDataInicio(primeiroDiaMes());
    setDataFim(hojeISO());
    setFiltroServico("todos");
    setFiltroStatus("todos");
  };

  return (
    <Admin>
      <Head>
        <title>Relatórios | Galeria da Beleza</title>
        <meta
          name="description"
          content="Relatórios financeiros e de desempenho da Galeria da Beleza"
        />
      </Head>

      <Box className="relatorios-pagina" sx={{ p: { xs: 1, md: 3 } }}>
        <Stack
          direction={{ xs: "column", sm: "row" }}
          justifyContent="space-between"
          alignItems={{ xs: "stretch", sm: "center" }}
          spacing={2}
          sx={{ mb: 3 }}
          className="relatorios-acoes"
        >
          <Box>
            <Stack direction="row" alignItems="center" spacing={1}>
              <AssessmentIcon color="primary" />
              <Typography variant="h5" fontWeight={700}>
                Relatórios
              </Typography>
            </Stack>

            <Typography color="text.secondary" variant="body2" sx={{ mt: 0.5 }}>
              Acompanhe o desempenho dos serviços e os resultados financeiros.
            </Typography>
          </Box>

          <Stack direction="row" spacing={1}>
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
              startIcon={<PictureAsPdfIcon />}
              onClick={exportarPDF}
              disabled={carregando || !periodoValido}
            >
              Exportar PDF
            </Button>
          </Stack>
        </Stack>

        {erro && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {erro}
          </Alert>
        )}

        <Card sx={{ mb: 3 }} className="relatorios-filtros">
          <CardContent>
            <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 2 }}>
              Filtros do relatório
            </Typography>

            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} sm={6} md={2.5}>
                <TextField
                  fullWidth
                  type="date"
                  label="Data inicial"
                  value={dataInicio}
                  onChange={(event) => setDataInicio(event.target.value)}
                  InputLabelProps={{ shrink: true }}
                  size="small"
                />
              </Grid>

              <Grid item xs={12} sm={6} md={2.5}>
                <TextField
                  fullWidth
                  type="date"
                  label="Data final"
                  value={dataFim}
                  onChange={(event) => setDataFim(event.target.value)}
                  InputLabelProps={{ shrink: true }}
                  size="small"
                />
              </Grid>

              <Grid item xs={12} sm={6} md={3}>
                <FormControl fullWidth size="small">
                  <InputLabel>Serviço</InputLabel>
                  <Select
                    value={filtroServico}
                    label="Serviço"
                    onChange={(event) => setFiltroServico(event.target.value)}
                  >
                    <MenuItem value="todos">Todos os serviços</MenuItem>
                    {servicosDisponiveis.map((servico) => (
                      <MenuItem key={servico.id} value={servico.id}>
                        {servico.nome}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} sm={6} md={2}>
                <FormControl fullWidth size="small">
                  <InputLabel>Status</InputLabel>
                  <Select
                    value={filtroStatus}
                    label="Status"
                    onChange={(event) => setFiltroStatus(event.target.value)}
                  >
                    <MenuItem value="todos">Todos os status</MenuItem>
                    {STATUS.map((status) => (
                      <MenuItem key={status.value} value={status.value}>
                        {status.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} md={2}>
                <Button fullWidth variant="text" onClick={limparFiltros}>
                  Limpar filtros
                </Button>
              </Grid>
            </Grid>

            {!periodoValido && (
              <Alert severity="warning" sx={{ mt: 2 }}>
                A data inicial não pode ser posterior à data final.
              </Alert>
            )}
          </CardContent>
        </Card>

        <Box className="relatorios-conteudo">
          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle2" color="text.secondary">
              Período: {nomePeriodo()}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {nomeServicoFiltro} · {nomeStatusFiltro} ·{" "}
              {formatarNumero(dadosFiltrados.length)} registros encontrados
            </Typography>
          </Box>

          {carregando ? (
            <Box
              sx={{
                minHeight: 250,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <CircularProgress />
            </Box>
          ) : (
            <>
              <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>
                Visão geral
              </Typography>

              <Grid container spacing={2} sx={{ mb: 4 }}>
                <Grid item xs={12} sm={6} md={3}>
                  <Indicador
                    titulo="Faturamento realizado"
                    valor={formatarMoeda(indicadores.faturamento)}
                    descricao="Somente serviços realizados"
                    icone={<AttachMoneyIcon />}
                    destaque
                  />
                </Grid>

                <Grid item xs={12} sm={6} md={3}>
                  <Indicador
                    titulo="Atendimentos realizados"
                    valor={formatarNumero(indicadores.quantidadeRealizados)}
                    descricao="Serviços concluídos"
                    icone={<EventAvailableIcon />}
                  />
                </Grid>

                <Grid item xs={12} sm={6} md={3}>
                  <Indicador
                    titulo="Ticket médio"
                    valor={formatarMoeda(indicadores.ticketMedio)}
                    descricao="Faturamento ÷ realizados"
                    icone={<AttachMoneyIcon />}
                  />
                </Grid>

                <Grid item xs={12} sm={6} md={3}>
                  <Indicador
                    titulo="Clientes atendidos"
                    valor={formatarNumero(indicadores.clientesUnicos)}
                    descricao="Clientes distintos no período"
                    icone={<PeopleAltIcon />}
                  />
                </Grid>

                <Grid item xs={12} sm={6} md={3}>
                  <Indicador
                    titulo="Tempo de atendimento"
                    valor={`${formatarNumero(
                      Math.floor(indicadores.minutosAtendidos / 60),
                    )}h ${String(indicadores.minutosAtendidos % 60).padStart(
                      2,
                      "0",
                    )}min`}
                    descricao="Duração total dos realizados"
                    icone={<ScheduleIcon />}
                  />
                </Grid>

                <Grid item xs={12} sm={6} md={3}>
                  <Indicador
                    titulo="Agendados"
                    valor={formatarNumero(indicadores.quantidadeAgendados)}
                    descricao="Status agendado"
                    icone={<EventAvailableIcon />}
                  />
                </Grid>

                <Grid item xs={12} sm={6} md={3}>
                  <Indicador
                    titulo="Confirmados"
                    valor={formatarNumero(indicadores.quantidadeConfirmados)}
                    descricao="Status confirmado"
                    icone={<EventAvailableIcon />}
                  />
                </Grid>

                <Grid item xs={12} sm={6} md={3}>
                  <Indicador
                    titulo="Faltas e cancelamentos"
                    valor={formatarNumero(
                      indicadores.quantidadeFaltas +
                        indicadores.quantidadeCancelados,
                    )}
                    descricao={`${indicadores.quantidadeFaltas} faltas · ${indicadores.quantidadeCancelados} cancelamentos`}
                    icone={<ScheduleIcon />}
                  />
                </Grid>
              </Grid>

              <Grid container spacing={3} sx={{ mb: 4 }}>
                <Grid item xs={12} md={7}>
                  <Card sx={{ height: "100%" }}>
                    <CardContent>
                      <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>
                        Faturamento por dia
                      </Typography>

                      {evolucaoDiaria.length === 0 ? (
                        <Typography color="text.secondary" variant="body2">
                          Não há atendimentos realizados neste período.
                        </Typography>
                      ) : (
                        <Stack spacing={2}>
                          {evolucaoDiaria.map((item) => (
                            <Box key={item.data}>
                              <Stack
                                direction="row"
                                justifyContent="space-between"
                                spacing={2}
                                sx={{ mb: 0.7 }}
                              >
                                <Typography variant="body2">
                                  {formatarData(item.data)}
                                </Typography>

                                <Typography variant="body2" fontWeight={600}>
                                  {formatarMoeda(item.faturamento)}
                                </Typography>
                              </Stack>

                              <BarraIndicador
                                valor={item.faturamento}
                                maximo={maiorFaturamentoDiario}
                              />

                              <Typography
                                variant="caption"
                                color="text.secondary"
                              >
                                {item.quantidade} atendimento(s)
                              </Typography>
                            </Box>
                          ))}
                        </Stack>
                      )}
                    </CardContent>
                  </Card>
                </Grid>

                <Grid item xs={12} md={5}>
                  <Card sx={{ height: "100%" }}>
                    <CardContent>
                      <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>
                        Situação dos agendamentos
                      </Typography>

                      <Stack spacing={2}>
                        {distribuicaoStatus.map((item) => (
                          <Box key={item.value}>
                            <Stack
                              direction="row"
                              justifyContent="space-between"
                              sx={{ mb: 0.7 }}
                            >
                              <Chip
                                size="small"
                                label={item.label}
                                color={item.color}
                              />
                              <Typography variant="body2" fontWeight={600}>
                                {formatarNumero(item.quantidade)}
                              </Typography>
                            </Stack>

                            <BarraIndicador
                              valor={item.quantidade}
                              maximo={dadosFiltrados.length}
                              cor={
                                item.value === "realizado"
                                  ? "success.main"
                                  : item.value === "faltou" ||
                                      item.value === "cancelado"
                                    ? "error.main"
                                    : "primary.main"
                              }
                            />
                          </Box>
                        ))}
                      </Stack>

                      <Typography
                        variant="caption"
                        color="text.secondary"
                        display="block"
                        sx={{ mt: 2 }}
                      >
                        Total de registros:{" "}
                        {formatarNumero(dadosFiltrados.length)}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>

              <Card sx={{ mb: 4 }}>
                <CardContent>
                  <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>
                    Desempenho dos serviços
                  </Typography>

                  {rankingServicos.length === 0 ? (
                    <Typography color="text.secondary" variant="body2">
                      Não há serviços realizados neste período.
                    </Typography>
                  ) : (
                    <TableContainer>
                      <Table size="small">
                        <TableHead>
                          <TableRow>
                            <TableCell>Serviço</TableCell>
                            <TableCell align="right">Quantidade</TableCell>
                            <TableCell align="right">Faturamento</TableCell>
                            <TableCell align="right">Participação</TableCell>
                            <TableCell align="right">Duração total</TableCell>
                          </TableRow>
                        </TableHead>

                        <TableBody>
                          {rankingServicos.map((item) => (
                            <TableRow key={item.id}>
                              <TableCell>
                                <Typography fontWeight={600} variant="body2">
                                  {item.nome}
                                </Typography>
                              </TableCell>

                              <TableCell align="right">
                                {formatarNumero(item.quantidade)}
                              </TableCell>

                              <TableCell align="right">
                                {formatarMoeda(item.faturamento)}
                              </TableCell>

                              <TableCell align="right">
                                {indicadores.faturamento > 0
                                  ? `${(
                                      (item.faturamento /
                                        indicadores.faturamento) *
                                      100
                                    ).toFixed(1)}%`
                                  : "0%"}
                              </TableCell>

                              <TableCell align="right">
                                {formatarNumero(item.duracao)} min
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  )}
                </CardContent>
              </Card>

              <Card sx={{ mb: 4 }}>
                <CardContent>
                  <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>
                    Ranking de faturamento por serviço
                  </Typography>

                  {rankingServicos.length === 0 ? (
                    <Typography color="text.secondary" variant="body2">
                      Nenhum dado disponível.
                    </Typography>
                  ) : (
                    <Stack spacing={2}>
                      {rankingServicos.map((item) => (
                        <Box key={item.id}>
                          <Stack
                            direction="row"
                            justifyContent="space-between"
                            spacing={2}
                            sx={{ mb: 0.7 }}
                          >
                            <Typography variant="body2">{item.nome}</Typography>
                            <Typography variant="body2" fontWeight={600}>
                              {formatarMoeda(item.faturamento)}
                            </Typography>
                          </Stack>

                          <BarraIndicador
                            valor={item.faturamento}
                            maximo={maiorFaturamentoServico}
                          />
                        </Box>
                      ))}
                    </Stack>
                  )}
                </CardContent>
              </Card>

              <Card sx={{ mb: 4 }}>
                <CardContent>
                  <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>
                    Clientes mais atendidos
                  </Typography>

                  {rankingClientes.length === 0 ? (
                    <Typography color="text.secondary" variant="body2">
                      Não há clientes atendidos neste período.
                    </Typography>
                  ) : (
                    <TableContainer>
                      <Table size="small">
                        <TableHead>
                          <TableRow>
                            <TableCell>Cliente</TableCell>
                            <TableCell align="right">Atendimentos</TableCell>
                            <TableCell align="right">
                              Faturamento gerado
                            </TableCell>
                          </TableRow>
                        </TableHead>

                        <TableBody>
                          {rankingClientes.map((item) => (
                            <TableRow key={item.id}>
                              <TableCell>
                                <Stack spacing={0.7}>
                                  <Typography variant="body2" fontWeight={600}>
                                    {item.nome}
                                  </Typography>
                                  <BarraIndicador
                                    valor={item.quantidade}
                                    maximo={maiorQuantidadeCliente}
                                  />
                                </Stack>
                              </TableCell>

                              <TableCell align="right">
                                {formatarNumero(item.quantidade)}
                              </TableCell>

                              <TableCell align="right">
                                {formatarMoeda(item.faturamento)}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  )}
                </CardContent>
              </Card>

              <Card className="relatorios-tabela-final">
                <CardContent>
                  <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>
                    Detalhamento dos agendamentos
                  </Typography>

                  {dadosFiltrados.length === 0 ? (
                    <Typography color="text.secondary" variant="body2">
                      Nenhum agendamento encontrado com os filtros selecionados.
                    </Typography>
                  ) : (
                    <TableContainer>
                      <Table size="small">
                        <TableHead>
                          <TableRow>
                            <TableCell>Data</TableCell>
                            <TableCell>Horário</TableCell>
                            <TableCell>Cliente</TableCell>
                            <TableCell>Serviço</TableCell>
                            <TableCell>Status</TableCell>
                            <TableCell align="right">Valor</TableCell>
                          </TableRow>
                        </TableHead>

                        <TableBody>
                          {[...dadosFiltrados]
                            .sort((a, b) => {
                              const data = String(a.data || "").localeCompare(
                                String(b.data || ""),
                              );
                              if (data !== 0) return data;

                              return String(a.horario || "").localeCompare(
                                String(b.horario || ""),
                              );
                            })
                            .map((item) => (
                              <TableRow key={item.id}>
                                <TableCell>{formatarData(item.data)}</TableCell>
                                <TableCell>{item.horario || "-"}</TableCell>
                                <TableCell>{obterNomeCliente(item)}</TableCell>
                                <TableCell>{obterNomeServico(item)}</TableCell>
                                <TableCell>
                                  <Chip
                                    size="small"
                                    label={rotuloStatus(item.status)}
                                    color={corStatus(item.status)}
                                  />
                                </TableCell>
                                <TableCell align="right">
                                  {formatarMoeda(item.valor)}
                                </TableCell>
                              </TableRow>
                            ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  )}
                </CardContent>
              </Card>

              <Typography
                variant="caption"
                color="text.secondary"
                display="block"
                sx={{ mt: 3 }}
              >
                Relatório gerado em {new Date().toLocaleString("pt-BR")}.
                Faturamento calculado com base nos agendamentos com status
                &quot;Realizado&quot;. Os valores representam o valor registrado
                no agendamento, não uma confirmação de recebimento.
              </Typography>
            </>
          )}
        </Box>
      </Box>

      <style>{`
  @media print {
    @page {
      size: A4;
      margin: 12mm;
    }

    body {
      background: #fff !important;
      color: #000 !important;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }

    body * {
      visibility: hidden;
    }

    .relatorios-pagina,
    .relatorios-pagina * {
      visibility: visible;
    }

    .relatorios-pagina {
      position: absolute !important;
      left: 0 !important;
      top: 0 !important;
      width: 100% !important;
      padding: 0 !important;
      margin: 0 !important;
    }

    .relatorios-acoes,
    .relatorios-filtros {
      display: none !important;
    }

    .relatorios-conteudo {
      width: 100% !important;
    }

    .MuiCard-root {
      box-shadow: none !important;
      break-inside: avoid;
      border: 1px solid #ddd !important;
    }

    .MuiTableContainer-root {
      overflow: visible !important;
    }

    .MuiTable-root {
      width: 100% !important;
    }

    .MuiTableCell-root {
      padding: 5px !important;
      font-size: 9px !important;
      color: #000 !important;
    }

    .MuiTypography-root {
      color: #000 !important;
    }

    .MuiChip-root {
      border: 1px solid #aaa !important;
    }

    .relatorios-tabela-final {
      break-inside: auto;
    }

    tr {
      break-inside: avoid;
    }
  }
`}</style>
    </Admin>
  );
}
