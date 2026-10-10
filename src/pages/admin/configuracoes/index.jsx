import * as React from "react";
import Admin from "../../../components/admin";

import Box from "@mui/material/Box";
import Grid from "@mui/material/Grid";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import Divider from "@mui/material/Divider";
import Switch from "@mui/material/Switch";
import FormControlLabel from "@mui/material/FormControlLabel";
import WhatsAppIcon from "@mui/icons-material/WhatsApp";
import BusinessIcon from "@mui/icons-material/Business";
import NotificationsActiveIcon from "@mui/icons-material/NotificationsActive";

export default function Configuracoes() {
  return (
    <Admin>
      <Box sx={{ width: "100%" }}>
        <Box sx={{ mb: 3 }}>
          <Typography variant="h4" fontWeight={700}>
            Configurações
          </Typography>

          <Typography color="text.secondary">
            Configure os dados e o funcionamento do sistema.
          </Typography>
        </Box>

        <Grid container spacing={2.5}>
          <Grid item xs={12} md={6}>
            <Paper
              elevation={0}
              sx={{
                p: 3,
                borderRadius: 3,
                border: "1px solid #eee",
              }}
            >
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 1,
                  mb: 2,
                }}
              >
                <BusinessIcon color="primary" />

                <Typography variant="h6" fontWeight={700}>
                  Dados da clínica
                </Typography>
              </Box>

              <Divider sx={{ mb: 3 }} />

              <TextField
                fullWidth
                label="Nome da clínica"
                defaultValue="Galeria da Beleza"
                sx={{ mb: 2 }}
              />

              <TextField fullWidth label="Telefone" sx={{ mb: 2 }} />

              <TextField fullWidth label="E-mail" sx={{ mb: 2 }} />

              <TextField fullWidth label="Endereço" multiline rows={2} />

              <Button
                variant="contained"
                sx={{
                  mt: 3,
                  borderRadius: 2,
                }}
              >
                Salvar alterações
              </Button>
            </Paper>
          </Grid>

          <Grid item xs={12} md={6}>
            <Paper
              elevation={0}
              sx={{
                p: 3,
                borderRadius: 3,
                border: "1px solid #eee",
              }}
            >
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 1,
                  mb: 2,
                }}
              >
                <WhatsAppIcon color="success" />

                <Typography variant="h6" fontWeight={700}>
                  WhatsApp
                </Typography>
              </Box>

              <Divider sx={{ mb: 3 }} />

              <TextField
                fullWidth
                label="Número conectado"
                placeholder="(54) 99999-9999"
                sx={{ mb: 2 }}
              />

              <TextField
                fullWidth
                label="API / Token"
                type="password"
                sx={{ mb: 2 }}
              />

              <Box
                sx={{
                  p: 2,
                  backgroundColor: "#f8f8f8",
                  borderRadius: 2,
                }}
              >
                <Typography variant="body2" color="text.secondary">
                  Status da conexão
                </Typography>

                <Typography
                  fontWeight={700}
                  color="warning.main"
                  sx={{ mt: 0.5 }}
                >
                  Não configurado
                </Typography>
              </Box>

              <Button
                variant="contained"
                color="success"
                sx={{
                  mt: 3,
                  borderRadius: 2,
                }}
              >
                Testar conexão
              </Button>
            </Paper>
          </Grid>

          <Grid item xs={12}>
            <Paper
              elevation={0}
              sx={{
                p: 3,
                borderRadius: 3,
                border: "1px solid #eee",
              }}
            >
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 1,
                  mb: 2,
                }}
              >
                <NotificationsActiveIcon color="primary" />

                <Typography variant="h6" fontWeight={700}>
                  Automações
                </Typography>
              </Box>

              <Divider sx={{ mb: 1 }} />

              <FormControlLabel
                control={<Switch defaultChecked />}
                label="Enviar confirmação automaticamente ao criar um agendamento"
              />

              <br />

              <FormControlLabel
                control={<Switch defaultChecked />}
                label="Enviar lembrete antes do procedimento"
              />

              <br />

              <FormControlLabel
                control={<Switch defaultChecked />}
                label="Enviar mensagem de feedback após o atendimento"
              />

              <br />

              <FormControlLabel
                control={<Switch />}
                label="Enviar mensagens de aniversário"
              />

              <br />

              <FormControlLabel
                control={<Switch />}
                label="Enviar mensagens de retorno automaticamente"
              />
            </Paper>
          </Grid>
        </Grid>
      </Box>
    </Admin>
  );
}
