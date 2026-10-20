import * as React from "react";
import Dialog from "@mui/material/Dialog";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import moment from "moment/moment";
import IconButton from "@mui/material/IconButton";
import CloseIcon from "@mui/icons-material/Close";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { TimePicker } from "@mui/x-date-pickers/TimePicker";
import { ptBR } from "@mui/x-date-pickers/locales";
import dayjs from "dayjs";
import styles from "../styles/admin/Grupo.Usuarios.module.css";
import { Button, ButtonGroup, DialogActions } from "@mui/material";

export default function AlterarDataHoraCarga({
  open = false,
  carga = null,
  handleClose,
  handleGravar,
}) {
  const [idCarga, setIdCarga] = React.useState(null);
  const [dataCadastro, setDataCadastro] = React.useState(new Date());
  const [horaCadastro, setHoraCadastro] = React.useState(new Date());

  React.useEffect(() => {
    if (open && carga !== null) {
      const { dataCadastro, id } = carga;

      const novaData = new Date(`${dataCadastro.split(" ")[0]} 08:00:00`);
      const novaHora = new Date(dataCadastro);

      setIdCarga(id);
      setDataCadastro(novaData);
      setHoraCadastro(novaHora);
    } else {
      setDataCadastro(new Date());
      setHoraCadastro(new Date());
    }
  }, [open, carga]);

  return (
    <div className="w-full">
      <Dialog fullWidth maxWidth={"sm"} open={open} onClose={handleClose}>
        <DialogTitle sx={{ textAlign: "center" }}>
          ATUALIZAR DATA/HORA
        </DialogTitle>
        <IconButton
          aria-label="close"
          onClick={handleClose}
          sx={{
            position: "absolute",
            right: 8,
            top: 8,
            color: (theme) => theme.palette.grey[500],
          }}
        >
          <CloseIcon />
        </IconButton>
        <DialogContent dividers>
          <div className={styles.row} style={{ justifyContent: "center" }}>
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
                  ptBR.components.MuiLocalizationProvider.defaultProps
                    .localeText
                }
                onChange={(e) => setDataCadastro(e)}
                sx={{ mx: ".5rem", mt: "16px", mb: "8px" }}
              />
              <TimePicker
                label="Hora"
                sx={{ mx: ".5rem", mt: "16px", mb: "8px" }}
                format="HH:mm"
                value={dayjs(horaCadastro)}
                onChange={(e) => setHoraCadastro(e)}
              />
            </LocalizationProvider>
          </div>
        </DialogContent>
        <DialogActions>
          <ButtonGroup>
            <Button
              variant="contained"
              sx={{ width: "150px" }}
              onClick={async () => {
                const novaDataCadastro = moment(new Date(dataCadastro)).format(
                  "YYYY-MM-DD"
                );
                const novaHoraCadastro = moment(new Date(horaCadastro)).format(
                  "HH:mm"
                );

                await handleGravar(idCarga, {
                  dataCadastro: `${novaDataCadastro} ${novaHoraCadastro}`,
                });
              }}
            >
              Gravar
            </Button>
            <Button sx={{ width: "150px" }} onClick={handleClose}>
              Cancelar
            </Button>
          </ButtonGroup>
        </DialogActions>
      </Dialog>
    </div>
  );
}
