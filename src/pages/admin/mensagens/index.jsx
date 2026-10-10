import * as React from "react";
import Admin from "../../../components/admin";

import Box from "@mui/material/Box";
import Grid from "@mui/material/Grid";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import Chip from "@mui/material/Chip";
import Button from "@mui/material/Button";
import Tabs from "@mui/material/Tabs";
import Tab from "@mui/material/Tab";
import WhatsAppIcon from "@mui/icons-material/WhatsApp";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import ErrorIcon from "@mui/icons-material/Error";
import ScheduleIcon from "@mui/icons-material/Schedule";

const mensagens = [
  {
    cliente: "Mariana Silva",
    tipo: "Lembrete de atendimento",
    horario: "Hoje, 08:30",
    status: "Enviada",
  },
  {
    cliente: "Ana Paula",
    tipo: "Confirmação de agendamento",
    horario: "Hoje, 09:15",
    status: "Enviada",
  },
  {
    cliente: "Carolina Souza",
    tipo: "Feedback pós-atendimento",
    horario: "Hoje, 10:00",
    status: "Pendente",
  },
  {
    cliente: "Juliana Martins",
    tipo: "Lembrete de atendimento",
    horario: "Hoje, 11:30",
    status: "Erro",
  },
];

export default function Mensagens() {
  const [tab, setTab] = React.useState(0);

  return (
    <Admin>
      <Box sx={{ width: "100%" }}>
        <Box sx={{ mb: 3 }}>
          <Typography variant="h4" fontWeight={700}>
            Mensagens
          </Typography>

          <Typography color="text.secondary">
            Acompanhe as mensagens e automações do WhatsApp.
          </Typography>
        </Box>

        <Grid container spacing={2.5} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={4}>
            <Paper
              elevation={0}
              sx={{
                p: 2.5,
                borderRadius: 3,
                border: "1px solid #eee",
              }}
            >
              <WhatsAppIcon color="success" />

              <Typography variant="h4" fontWeight={700} sx={{ mt: 1 }}>
                128
              </Typography>

              <Typography color="text.secondary">Mensagens enviadas</Typography>
            </Paper>
          </Grid>

          <Grid item xs={12} sm={4}>
            <Paper
              elevation={0}
              sx={{
                p: 2.5,
                borderRadius: 3,
                border: "1px solid #eee",
              }}
            >
              <ScheduleIcon color="warning" />

              <Typography variant="h4" fontWeight={700} sx={{ mt: 1 }}>
                7
              </Typography>

              <Typography color="text.secondary">
                Mensagens pendentes
              </Typography>
            </Paper>
          </Grid>

          <Grid item xs={12} sm={4}>
            <Paper
              elevation={0}
              sx={{
                p: 2.5,
                borderRadius: 3,
                border: "1px solid #eee",
              }}
            >
              <ErrorIcon color="error" />

              <Typography variant="h4" fontWeight={700} sx={{ mt: 1 }}>
                2
              </Typography>

              <Typography color="text.secondary">Falhas de envio</Typography>
            </Paper>
          </Grid>
        </Grid>

        <Paper
          elevation={0}
          sx={{
            borderRadius: 3,
            border: "1px solid #eee",
            overflow: "hidden",
          }}
        >
          <Tabs
            value={tab}
            onChange={(event, value) => setTab(value)}
            sx={{ px: 2 }}
          >
            <Tab label="Histórico" />
            <Tab label="Automações" />
            <Tab label="Modelos" />
          </Tabs>

          {tab === 0 && (
            <Box>
              {mensagens.map((mensagem, index) => (
                <Box
                  key={index}
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 2,
                    p: 2,
                    borderTop: "1px solid #eee",
                    flexWrap: "wrap",
                  }}
                >
                  <Box sx={{ flex: 1 }}>
                    <Typography fontWeight={600}>{mensagem.cliente}</Typography>

                    <Typography variant="body2" color="text.secondary">
                      {mensagem.tipo}
                    </Typography>
                  </Box>

                  <Typography variant="body2" color="text.secondary">
                    {mensagem.horario}
                  </Typography>

                  <Chip
                    size="small"
                    icon={
                      mensagem.status === "Enviada" ? (
                        <CheckCircleIcon />
                      ) : mensagem.status === "Erro" ? (
                        <ErrorIcon />
                      ) : (
                        <ScheduleIcon />
                      )
                    }
                    label={mensagem.status}
                    color={
                      mensagem.status === "Enviada"
                        ? "success"
                        : mensagem.status === "Erro"
                          ? "error"
                          : "warning"
                    }
                    variant="outlined"
                  />
                </Box>
              ))}
            </Box>
          )}

          {tab === 1 && (
            <Box sx={{ p: 3 }}>
              <Typography fontWeight={700}>Automações configuradas</Typography>

              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                Aqui serão configuradas as regras automáticas de comunicação com
                os clientes.
              </Typography>

              <Box sx={{ mt: 3 }}>
                {[
                  "Confirmação de agendamento",
                  "Lembrete do procedimento",
                  "Feedback pós-atendimento",
                  "Mensagem de retorno",
                  "Mensagem de aniversário",
                ].map((item) => (
                  <Box
                    key={item}
                    sx={{
                      p: 2,
                      border: "1px solid #eee",
                      borderRadius: 2,
                      mb: 1,
                    }}
                  >
                    <Typography fontWeight={600}>{item}</Typography>
                  </Box>
                ))}
              </Box>
            </Box>
          )}

          {tab === 2 && (
            <Box sx={{ p: 3 }}>
              <Typography fontWeight={700}>Modelos de mensagens</Typography>

              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                Os modelos utilizados pelas automações serão gerenciados aqui.
              </Typography>

              <Button variant="outlined" sx={{ mt: 3 }}>
                Novo modelo
              </Button>
            </Box>
          )}
        </Paper>
      </Box>
    </Admin>
  );
}
