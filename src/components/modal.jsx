import * as React from "react";
import PropTypes from "prop-types";
import { styled } from "@mui/material/styles";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import IconButton from "@mui/material/IconButton";
import CloseIcon from "@mui/icons-material/Close";
import styles from "../styles/Modal.module.css";

import Box from "@mui/material/Box";
import TextField from "@mui/material/TextField";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import Snackbar from "@mui/material/Snackbar";
import Button from "@mui/material/Button";
import MuiAlert from "@mui/material/Alert";

const BootstrapDialog = styled(Dialog)(({ theme }) => ({
  "& .MuiDialogContent-root": {
    padding: theme.spacing(2),
  },
  "& .MuiDialogActions-root": {
    padding: theme.spacing(1),
  },
}));


const Alert = React.forwardRef(function Alert(props, ref) {
  return <MuiAlert elevation={6} ref={ref} variant="filled" {...props} />;
});

const themeOptions = {
  palette: {
    type: "black",
    primary: {
      main: "#01030e",
    },
    secondary: {
      main: "#01030e",
    },
  },
};

const theme = createTheme(themeOptions);

const BootstrapDialogTitle = (props) => {
  const { children, onClose, ...other } = props;

  return (
    <DialogTitle sx={{ m: 0, p: 2 }} {...other}>
      {children}
      {onClose ? (
        <IconButton
          aria-label="close"
          onClick={onClose}
          sx={{
            position: "absolute",
            right: 8,
            top: 8,
            color: (theme) => theme.palette.grey[500],
          }}
        >
          <CloseIcon />
        </IconButton>
      ) : null}
    </DialogTitle>
  );
};

BootstrapDialogTitle.propTypes = {
  children: PropTypes.node,
  onClose: PropTypes.func.isRequired,
};

export default function Modal({
  titulo="Seja um Franqueado",
  open = true,
  toggleModal,
}) {
  const [showModal, setShowModal] = React.useState(true);

  React.useEffect(() => {
    setShowModal(open);
  }, [open]);

  const handleCloseModal = () => {
    toggleModal(false);
  };

  const [nome, setNome] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [telefone, setTelefone] = React.useState("");
  const [mensagem, setMensagem] = React.useState("");
  const [disableButton, setDisableButton] = React.useState(false);
  const [showAlertSuccess, setShowAlertSuccess] = React.useState(false);
  const [showAlertDanger, setShowAlertDanger] = React.useState(false);

  return (
    <div style={{ overflowY: "hidden" }}>
      <BootstrapDialog
        disableScrollLock
        onClose={handleCloseModal}
        aria-labelledby="customized-dialog-title"
        open={showModal}
        maxWidth="sm"
        fullWidth={true}
      >
        <BootstrapDialogTitle
          id="customized-dialog-title"
          onClose={handleCloseModal}
        >
            <div className={styles.head}>
              <h2>{titulo}</h2> &nbsp;
            </div>
        </BootstrapDialogTitle>
        <DialogContent>
          <div className={styles.root}>

          <div
          className={styles.box_row}         
        >
          <div className={` ${styles.mobile}`}>
            <div
              className={` ${styles.box}`}
              style={{ alignItems: "flex-start" }}
            >
              <ThemeProvider theme={theme}>
                <Box
                  id="form"
                  component="form"
                  noValidate
                  onSubmit={(event) => {
                    event.preventDefault();
                    const data = new FormData(event.currentTarget);

                    const nome = data.get("nome");
                    const email = data.get("email");
                    const telefone = data.get("telefone");
                    const mensagem = data.get("mensagem");

                    if (
                      nome.trim() === "" ||
                      email.trim() === "" ||
                      telefone.trim() === "" ||
                      mensagem.trim() === ""
                    ) {
                      setShowAlertDanger(true);
                      return;
                    }

                    setDisableButton(true);

                    SendContato({
                      nome,
                      email,
                      telefone,
                      mensagem,
                    })
                      .then((retorno) => {
                        const { status } = retorno;

                        if (status === 201) {
                          setShowAlertSuccess(true);
                        } else {
                          setShowAlertDanger(true);
                        }
                      })
                      .catch(() => setShowAlertDanger(true))
                      .finally(() => {
                        setNome("");
                        setEmail("");
                        setTelefone("");
                        setMensagem("");
                        setDisableButton(false);
                      });
                  }}
                  sx={{ width: "100%" }}
                >
                  <TextField
                    label="Seu nome *"
                    id="nome"
                    name="nome"
                    value={nome}
                    onChange={(e) => setNome(e.target.value)}
                    color="secondary"
                    size="small"
                    focused
                    sx={{
                      input: { color: "000000" },
                      width: "100%",
                      maxWidth: "50rem",
                      margin: "0.6rem",
                    }}
                  />
                  <TextField
                    label="E-mail *"
                    id="email"
                    name="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}                    
                    color="secondary"
                    size="small"
                    focused
                    sx={{
                      input: { color: "000000" },
                      width: "100%",
                      maxWidth: "50rem",
                      margin: "0.6rem",
                    }}
                  />
                  <TextField
                    label="Telefone *"
                    id="telefone"
                    name="telefone"
                    value={telefone}
                    onChange={(e) => setTelefone(e.target.value)}                    
                    color="secondary"
                    size="small"
                    focused
                    sx={{
                      input: { color: "000000" },
                      width: "100%",
                      maxWidth: "50rem",
                      margin: "0.6rem",
                    }}
                  />
                  <TextField
                    label="Conte um pouco da sua necessidade *"
                    id="mensagem"
                    name="mensagem"
                    value={mensagem}
                    onChange={(e) => setMensagem(e.target.value)}                    
                    color="secondary"
                    size="small"
                    focused
                    multiline
                    rows={3}
                    sx={{
                      textarea: { color: "000000" },
                      width: "100%",
                      maxWidth: "50rem",
                      margin: "0.6rem",
                    }}
                  />
                  
                </Box>
                
              </ThemeProvider>
              <Button
                    type="submit"
                    fullWidth
                    variant="contained"
                    sx={{
                      mt: 1,
                      mb: 2,
                      mx: ".6rem",
                      pt: 1,
                      pb: 1,
                      maxWidth: "15rem",
                      color: "000000",
                      fontWeight: "bold",
                    }}
                    style={{ backgroundColor: "#01030e" }}
                    disabled={false}
                  >
                    Enviar
                  </Button>
            </div>
          </div>
        </div>

      <Snackbar
        open={showAlertSuccess}
        autoHideDuration={6000}
        onClose={() => setShowAlertSuccess(false)}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      >
        <Alert
          onClose={() => setShowAlertSuccess(false)}
          severity="success"
          sx={{ width: "100%" }}
        >
          Seu contato foi enviado com sucesso!
        </Alert>
      </Snackbar>
      <Snackbar
        open={showAlertDanger}
        autoHideDuration={6000}
        onClose={() => setShowAlertDanger(false)}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      >
        <Alert
          onClose={() => setShowAlertDanger(false)}
          severity="warning"
          sx={{ width: "100%" }}
        >
          Não foi possível enviar o contato! Verifique se todos os campos
          obrigatórios foram preenchidos!
        </Alert>
      </Snackbar>
          </div>
        </DialogContent>
      </BootstrapDialog>
    </div>
  );
}
