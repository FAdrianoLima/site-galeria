import * as React from "react";
import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { TimePicker } from "@mui/x-date-pickers/TimePicker";
import { ptBR } from "@mui/x-date-pickers/locales";
import dayjs from "dayjs";
import styles from "../../../../styles/admin/Grupo.Usuarios.module.css";
import moment from "moment";

export default function ModalDialogEdicao({
  open = false,
  carga = {},
  handleClose,
  handleGravar,
}) {
  const [id, setId] = React.useState(null);
  const [dataCadastro, setDataCadastro] = React.useState(new Date());
  const [horaCadastro, setHoraCadastro] = React.useState(new Date());
  const [motorista, setMotorista] = React.useState("");
  const [cliente, setCliente] = React.useState("");
  const [notaFiscal, setNotaFiscal] = React.useState("");
  const [observacao, setObservacao] = React.useState("");

  React.useEffect(() => {
    if (open) {
      const novaData = new Date(`${carga.dataCadastro.split(" ")[0]} 08:00:00`);
      const novaHora = new Date(carga.dataCadastro);

      setId(carga.id);
      setDataCadastro(novaData);
      setHoraCadastro(novaHora);
      setMotorista(carga.motorista);
      setCliente(carga.cliente);
      setNotaFiscal(carga.nrNotaFiscal);
      setObservacao(carga.observacao);
    }
  }, [open]);

  return (
    <Dialog open={open} onClose={handleClose} maxWidth={"md"} fullWidth={true}>
      <DialogTitle>Edição Carga</DialogTitle>
      <DialogContent>
        <div className={styles.row}>
          <TextField
            value={`${cliente.cpfCnpj} - ${cliente.nome}`}
            margin="dense"
            id="name"
            name="email"
            label="Cliente"
            type="text"
            fullWidth
            variant="outlined"
            disabled
            sx={{ mx: ".5rem" }}
          />
        </div>
        <div className={styles.row} style={{ justifyContent: "flex-start" }}>
          <LocalizationProvider
            dateAdapter={AdapterDayjs}
            localeText={
              ptBR.components.MuiLocalizationProvider.defaultProps.localeText
            }
          >
            <DatePicker
              label="Data"
              format="DD/MM/YYYY"
              value={dayjs(dataCadastro)}
              localeText={
                ptBR.components.MuiLocalizationProvider.defaultProps.localeText
              }
              onChange={(e) => setDataCadastro(e)}
              sx={{ width: "250px", mx: ".5rem", mt: "16px", mb: "8px" }}
            />
            <TimePicker
              label="Hora"
              sx={{ width: "200px", mx: ".5rem", mt: "16px", mb: "8px" }}
              format="HH:mm"
              value={dayjs(horaCadastro)}
              onChange={(e) => setHoraCadastro(e)}
            />
          </LocalizationProvider>
          <TextField
            value={motorista}
            onChange={(e) => setMotorista(e.target.value)}
            margin="dense"
            id="motorista"
            name="motorista"
            label="Motorista"
            type="text"
            fullWidth
            variant="outlined"
            sx={{ mx: ".5rem", mt: "16px", mb: "8px" }}
          />
        </div>
        <div className={styles.row}>
          <TextField
            value={notaFiscal}
            onChange={(e) => setNotaFiscal(e.target.value)}
            margin="dense"
            id="nf"
            name="nf"
            label="Notas Fiscais"
            type="text"
            fullWidth
            variant="outlined"
            sx={{ mx: ".5rem" }}
          />
        </div>
        <div className={styles.row}>
          <TextField
            value={observacao}
            onChange={(e) => setObservacao(e.target.value)}
            margin="dense"
            id="observacao"
            name="observacao"
            label="Observação"
            type="text"
            multiline
            rows={4}
            fullWidth
            variant="outlined"
            sx={{ mx: ".5rem" }}
          />
        </div>
      </DialogContent>
      <DialogActions sx={{ px: "2rem", pb: "1rem" }}>
        <Button
          variant="contained"
          onClick={() => {
            const novaData = moment(new Date(dataCadastro)).format(
              "YYYY-MM-DD"
            );
            const novaHora = moment(new Date(horaCadastro)).format("HH:mm");

            const novoDataCadastro = `${novaData} ${novaHora}:00`;

            const carga = {
              cliente,
              dataCadastro: novoDataCadastro,
              motorista,
              nrNotaFiscal: notaFiscal,
              observacao,
            };

            handleGravar(id, carga);
          }}
        >
          Confirmar
        </Button>
        <Button variant="outlined" onClick={handleClose}>
          Cancelar
        </Button>
      </DialogActions>
    </Dialog>
  );
}
