import * as React from "react";
import Head from "next/head";
import Image from "next/image";
import Button from "@mui/material/Button";
import CssBaseline from "@mui/material/CssBaseline";
import TextField from "@mui/material/TextField";
import Link from "@mui/material/Link";
import Container from "@mui/material/Container";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { createTheme, ThemeProvider } from "@mui/material/styles";
import Backdrop from "@mui/material/Backdrop";
import CircularProgress from "@mui/material/CircularProgress";
import VisualizarCarga from "../../components/visualizarCarga";
import { ReadByHash } from "../../services/cargas";
import Snackbar from "@mui/material/Snackbar";
import MuiAlert from "@mui/material/Alert";
import SearchIcon from "@mui/icons-material/Search";

const Alert2 = React.forwardRef(function Alert(props, ref) {
  return <MuiAlert elevation={6} ref={ref} variant="filled" {...props} />;
});

function Copyright(props) {
  return (
    <Typography
      variant="body2"
      color="text.secondary"
      align="center"
      {...props}
    >
      {"Copyright © "}
      <Link color="inherit" href="https://cjstransportes.com.br/">
        CJS Transportes
      </Link>
      &nbsp;
      {new Date().getFullYear()}
      {"."}
    </Typography>
  );
}

const theme = createTheme({
  palette: {
    background: {
      default: "#fff",
    },
    primary: {
      main: "#25AAE2",
      contrastText: "#fff",
    },
    secondary: {
      main: "#3363AC",
      contrastText: "#fff",
    },
  },
});

export default function SignInSide() {
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState({});

  const [open, setOpen] = React.useState(false);
  const [showAlert, setShowAlert] = React.useState(false);
  const [openModal, setOpenModal] = React.useState(false);
  const [cargaSelecionada, setCargaSelecionada] = React.useState({});
  const [cnpj, setCnpj] = React.useState("");
  const [nrNotaFiscal, setNrNotaFiscal] = React.useState("");

  const handleSubmit = async (event) => {
    event.preventDefault();

    let possuiErro = false;
    const novoError = { ...error };

    if (cnpj.trim() === "") {
      possuiErro = true;
      novoError.cnpj = true;
    }

    if (nrNotaFiscal.trim() === "") {
      possuiErro = true;
      novoError.nrNotaFiscal = true;
    }

    if (possuiErro) {
      setError(novoError);
      return;
    }

    setLoading(true);

    try {
      const novoCnpj = cnpj
        .split(".")
        .join("")
        .split("-")
        .join("")
        .split("/")
        .join("");

      const novoNotaFiscal = nrNotaFiscal
        .split(" ")
        .join("")
        .split(".")
        .join("")
        .split("-")
        .join()
        .split("/")
        .join();

      const hash = Buffer.from(`${novoCnpj}:${novoNotaFiscal}`).toString(
        "base64",
      );

      const retornoCarga = await ReadByHash(hash);

      setCargaSelecionada(retornoCarga);
      setOpenModal(true);
    } catch (error) {
      setShowAlert(true);
    }

    setLoading(false);
  };

  const handleOpenDialog = ({ open = false }) => {
    setOpen(open);
  };

  return (
    <ThemeProvider theme={theme}>
      <Head>
        <title>Sistema CJS Transportes</title>
        <meta name="description" content="Sistema CJS Transportes" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/" />
      </Head>
      <Backdrop
        sx={{ color: "#fff", zIndex: (theme) => theme.zIndex.drawer + 1 }}
        open={loading}
      >
        <CircularProgress color="inherit" />
      </Backdrop>
      <Container component="main" maxWidth="xs" sx={{ background: "white" }}>
        <CssBaseline />
        <Box
          sx={{
            marginTop: 8,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
          }}
        >
          <div className="w-[20rem] h-auto pb-[2rem]">
            <Image
              src={"/static/images/logo-galeria-da-beleza.png"}
              alt={"Logo Atualize"}
              width={198}
              height={57}
              layout="responsive"
            />
          </div>

          <Typography component="h1" variant="h5">
            Pesquisa de carga
          </Typography>
          <Box
            component="form"
            noValidate
            onSubmit={handleSubmit}
            sx={{ mt: 1 }}
          >
            <TextField
              margin="normal"
              required
              fullWidth
              id="cnpj"
              label="CNPJ"
              name="cnpj"
              autoFocus
              onChange={(e) => setCnpj(e.target.value)}
              onFocus={() => {
                const newError = { ...error };
                newError.cnpj = false;
                setError(newError);
              }}
              error={error.cnpj}
              helperText={error.cnpj ? "campo obrigatório" : ""}
            />
            <TextField
              margin="normal"
              required
              fullWidth
              id="nrNotaFiscal"
              label="Nº da Nota Fiscal"
              name="nrNotaFiscal"
              onChange={(e) => setNrNotaFiscal(e.target.value)}
              onFocus={() => {
                const newError = { ...error };
                newError.nrNotaFiscal = false;
                setError(newError);
              }}
              error={error.nrNotaFiscal}
              helperText={error.nrNotaFiscal ? "campo obrigatório" : ""}
            />

            <Button
              type="submit"
              fullWidth
              variant="contained"
              sx={{ mt: 3, mb: 2, p: "0.9rem" }}
            >
              <SearchIcon />
              &nbsp; Pesquisar
            </Button>
          </Box>
        </Box>
        <Copyright sx={{ mt: 8, mb: 4 }} />
      </Container>

      <VisualizarCarga
        handleClose={() => setOpenModal(false)}
        open={openModal}
        carga={cargaSelecionada}
      />

      <Snackbar
        open={showAlert}
        autoHideDuration={6000}
        onClose={() => setShowAlert(false)}
        anchorOrigin={{ vertical: "top", horizontal: "right" }}
      >
        <Alert2
          onClose={() => setShowAlert(false)}
          severity="error"
          sx={{ width: "100%" }}
        >
          Carga não encontrada! Verifique se os dados foram inseridos
          corretamente!
        </Alert2>
      </Snackbar>
    </ThemeProvider>
  );
}
