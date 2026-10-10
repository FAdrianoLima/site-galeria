import * as React from "react";
import Admin from "../../components/admin";
import { db } from "../../../firebase-config";

import { collection, getDocs } from "firebase/firestore";

import {
  Box,
  Grid,
  Paper,
  Typography,
  Chip,
  Avatar,
  CircularProgress,
  Alert,
  Button,
} from "@mui/material";

import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import PeopleAltIcon from "@mui/icons-material/PeopleAlt";
import WhatsAppIcon from "@mui/icons-material/WhatsApp";
import ScheduleIcon from "@mui/icons-material/Schedule";
import RefreshIcon from "@mui/icons-material/Refresh";

const normalizar = (valor) =>
  String(valor || "")
    .trim()
    .toLowerCase();

const obterData = (valor) => {
  if (!valor) return null;

  if (typeof valor?.toDate === "function") {
    return valor.toDate();
  }

  if (valor instanceof Date) {
    return valor;
  }

  if (typeof valor === "string") {
    // Datas YYYY-MM-DD devem ser comparadas sem conversão de fuso.
    if (/^\d{4}-\d{2}-\d{2}$/.test(valor)) {
      return valor;
    }

    const data = new Date(valor);
    return Number.isNaN(data.getTime()) ? null : data;
  }

  return null;
};

const dataLocalISO = (data = new Date()) => {
  const ano = data.getFullYear();
  const mes = String(data.getMonth() + 1).padStart(2, "0");
  const dia = String(data.getDate()).padStart(2, "0");

  return `${ano}-${mes}-${dia}`;
};

const pertenceAoDia = (valor, hoje) => {
  const data = obterData(valor);

  if (!data) return false;

  if (typeof data === "string") {
    return data === hoje;
  }

  return dataLocalISO(data) === hoje;
};

const formatarHorario = (valor) => {
  if (!valor) return "--:--";

  if (typeof valor === "string") {
    return valor.slice(0, 5);
  }

  return "--:--";
};

const formatarStatus = (status) => {
  const valor = normalizar(status);

  const nomes = {
    agendado: "Agendado",
    confirmado: "Confirmado",
    realizado: "Realizado",
    cancelado: "Cancelado",
    faltou: "Faltou",
    remarcado: "Remarcado",
    aguardando: "Aguardando",
    pendente: "Pendente",
    enviado: "Enviado",
    falha: "Falha",
    erro: "Falha",
  };

  return nomes[valor] || status || "Sem status";
};

const statusConfirmado = (status) =>
  ["confirmado", "confirmada"].includes(normalizar(status));

const statusEnviado = (status) =>
  ["enviado", "enviada", "enviado com sucesso", "sucesso"].includes(
    normalizar(status),
  );

const statusFalha = (status) =>
  ["falha", "erro", "failed", "error"].includes(normalizar(status));

const statusPendente = (status) =>
  ["pendente", "pending", "aguardando", "agendado"].includes(
    normalizar(status),
  );

function CardIndicador({ titulo, valor, descricao, icon }) {
  return (
    <Paper
      elevation={0}
      sx={{
        p: 2.5,
        borderRadius: 3,
        border: "1px solid #eee",
        height: "100%",
      }}
    >
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 2,
        }}
      >
        <Avatar
          sx={{
            bgcolor: "rgba(139, 92, 246, .10)",
            color: "primary.main",
          }}
        >
          {icon}
        </Avatar>

        <Typography variant="h4" sx={{ fontWeight: 700, color: "#333" }}>
          {valor}
        </Typography>
      </Box>

      <Typography sx={{ mt: 2, fontWeight: 600 }}>{titulo}</Typography>

      <Typography variant="body2" color="text.secondary">
        {descricao}
      </Typography>
    </Paper>
  );
}

export default function Dashboard() {
  const [carregando, setCarregando] = React.useState(true);
  const [erro, setErro] = React.useState("");
  const [ultimaAtualizacao, setUltimaAtualizacao] = React.useState(null);

  const [dados, setDados] = React.useState({
    clientes: 0,
    atendimentosHoje: 0,
    confirmadosHoje: 0,
    mensagensEnviadasHoje: 0,
    lembretesPendentes: 0,
    mensagensEnviadas: 0,
    falhas: 0,
    agenda: [],
  });

  const carregarDados = React.useCallback(async () => {
    setCarregando(true);
    setErro("");

    try {
      const [clientesSnap, agendamentosSnap, servicosSnap, mensagensSnap] =
        await Promise.all([
          getDocs(collection(db, "clientes")),
          getDocs(collection(db, "agendamentos")),
          getDocs(collection(db, "servicos")),
          getDocs(collection(db, "mensagens")),
        ]);

      const hoje = dataLocalISO();

      const clientes = clientesSnap.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      const servicos = servicosSnap.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      const mapaClientes = new Map(
        clientes.map((cliente) => [cliente.id, cliente]),
      );

      const mapaServicos = new Map(
        servicos.map((servico) => [servico.id, servico]),
      );

      const agendamentos = agendamentosSnap.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      const mensagens = mensagensSnap.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      const agendaHoje = agendamentos
        .filter((item) => pertenceAoDia(item.data, hoje))
        .sort((a, b) =>
          String(a.horario || "").localeCompare(String(b.horario || "")),
        );

      const agendaFormatada = agendaHoje.map((item) => {
        const cliente = mapaClientes.get(item.clienteId);
        const servico = mapaServicos.get(item.servicoId);

        return {
          id: item.id,
          horario: formatarHorario(item.horario),
          cliente:
            cliente?.nome ||
            cliente?.nomeFantasia ||
            "Cliente não identificado",
          servico:
            servico?.nome || servico?.titulo || "Serviço não identificado",
          status: formatarStatus(item.status),
          statusOriginal: item.status,
        };
      });

      const confirmadosHoje = agendaHoje.filter((item) =>
        statusConfirmado(item.status),
      ).length;

      const mensagensEnviadasHoje = mensagens.filter((item) => {
        const status = item.status;
        const dataEnvio = item.enviadoEm || item.enviadaEm;

        return statusEnviado(status) && pertenceAoDia(dataEnvio, hoje);
      }).length;

      const lembretesPendentes = mensagens.filter((item) =>
        statusPendente(item.status),
      ).length;

      const mensagensEnviadas = mensagens.filter((item) =>
        statusEnviado(item.status),
      ).length;

      const falhas = mensagens.filter((item) =>
        statusFalha(item.status),
      ).length;

      setDados({
        clientes: clientes.length,
        atendimentosHoje: agendaHoje.length,
        confirmadosHoje,
        mensagensEnviadasHoje,
        lembretesPendentes,
        mensagensEnviadas,
        falhas,
        agenda: agendaFormatada,
      });

      setUltimaAtualizacao(new Date());
    } catch (error) {
      console.error("Erro ao carregar dashboard:", error);

      setErro(
        error?.code === "permission-denied"
          ? "O Firebase bloqueou a leitura dos dados. Verifique as regras do Firestore e a autenticação do usuário."
          : "Não foi possível carregar os dados do dashboard. Confira o console para ver o erro.",
      );
    } finally {
      setCarregando(false);
    }
  }, []);

  React.useEffect(() => {
    carregarDados();
  }, [carregarDados]);

  return (
    <Admin>
      <Box sx={{ width: "100%", pb: 3 }}>
        <Box
          sx={{
            mb: 3,
            display: "flex",
            alignItems: { xs: "flex-start", sm: "center" },
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 2,
          }}
        >
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 700, color: "#333" }}>
              Olá! 👋
            </Typography>

            <Typography color="text.secondary">
              Aqui está o resumo da Galeria da Beleza hoje.
            </Typography>

            {ultimaAtualizacao && (
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ display: "block", mt: 0.5 }}
              >
                Atualizado às {ultimaAtualizacao.toLocaleTimeString("pt-BR")}
              </Typography>
            )}
          </Box>

          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={carregarDados}
            disabled={carregando}
          >
            Atualizar
          </Button>
        </Box>

        {erro && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {erro}
          </Alert>
        )}

        <Grid container spacing={2.5}>
          <Grid item xs={12} sm={6} md={3}>
            <CardIndicador
              titulo="Atendimentos hoje"
              valor={carregando ? "—" : dados.atendimentosHoje}
              descricao="Agendamentos para hoje"
              icon={<CalendarMonthIcon />}
            />
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <CardIndicador
              titulo="Confirmados"
              valor={carregando ? "—" : dados.confirmadosHoje}
              descricao="Agendamentos confirmados hoje"
              icon={<ScheduleIcon />}
            />
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <CardIndicador
              titulo="Clientes"
              valor={carregando ? "—" : dados.clientes}
              descricao="Clientes cadastrados"
              icon={<PeopleAltIcon />}
            />
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <CardIndicador
              titulo="Mensagens"
              valor={carregando ? "—" : dados.mensagensEnviadasHoje}
              descricao="Enviadas hoje"
              icon={<WhatsAppIcon />}
            />
          </Grid>

          <Grid item xs={12} md={8}>
            <Paper
              elevation={0}
              sx={{
                borderRadius: 3,
                border: "1px solid #eee",
                overflow: "hidden",
                height: "100%",
              }}
            >
              <Box
                sx={{
                  p: 2.5,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 2,
                }}
              >
                <Box>
                  <Typography variant="h6" fontWeight={700}>
                    Agenda de hoje
                  </Typography>

                  <Typography variant="body2" color="text.secondary">
                    {carregando
                      ? "Carregando agendamentos..."
                      : `${dados.atendimentosHoje} atendimento(s) agendado(s)`}
                  </Typography>
                </Box>

                {carregando && <CircularProgress size={22} />}
              </Box>

              {!carregando && dados.agenda.length === 0 && (
                <Box
                  sx={{
                    p: 4,
                    textAlign: "center",
                    borderTop: "1px solid #eee",
                  }}
                >
                  <CalendarMonthIcon
                    sx={{ fontSize: 36, color: "text.disabled", mb: 1 }}
                  />
                  <Typography fontWeight={600}>
                    Nenhum atendimento para hoje
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Os agendamentos cadastrados aparecerão aqui.
                  </Typography>
                </Box>
              )}

              {!carregando &&
                dados.agenda.map((item) => (
                  <Box
                    key={item.id}
                    sx={{
                      px: 2.5,
                      py: 1.8,
                      borderTop: "1px solid #eee",
                      display: "flex",
                      alignItems: "center",
                      gap: 2,
                    }}
                  >
                    <Typography
                      sx={{
                        width: 55,
                        flexShrink: 0,
                        fontWeight: 700,
                      }}
                    >
                      {item.horario}
                    </Typography>

                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography fontWeight={600}>{item.cliente}</Typography>

                      <Typography variant="body2" color="text.secondary">
                        {item.servico}
                      </Typography>
                    </Box>

                    <Chip
                      size="small"
                      label={item.status}
                      color={
                        statusConfirmado(item.statusOriginal)
                          ? "success"
                          : statusFalha(item.statusOriginal)
                            ? "error"
                            : "default"
                      }
                      variant="outlined"
                    />
                  </Box>
                ))}
            </Paper>
          </Grid>

          <Grid item xs={12} md={4}>
            <Paper
              elevation={0}
              sx={{
                p: 2.5,
                borderRadius: 3,
                border: "1px solid #eee",
                height: "100%",
              }}
            >
              <Typography variant="h6" fontWeight={700}>
                Automações
              </Typography>

              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Situação dos registros de mensagens
              </Typography>

              {carregando ? (
                <CircularProgress size={22} />
              ) : (
                <>
                  <Box sx={{ mb: 2.5 }}>
                    <Typography fontWeight={700}>
                      {dados.lembretesPendentes}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Mensagens pendentes
                    </Typography>
                  </Box>

                  <Box sx={{ mb: 2.5 }}>
                    <Typography fontWeight={700}>
                      {dados.mensagensEnviadas}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Mensagens enviadas
                    </Typography>
                  </Box>

                  <Box>
                    <Typography fontWeight={700} color="error.main">
                      {dados.falhas}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Falhas de envio
                    </Typography>
                  </Box>
                </>
              )}
            </Paper>
          </Grid>
        </Grid>
      </Box>
    </Admin>
  );
}
