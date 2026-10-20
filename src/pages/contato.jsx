import * as React from "react";
import Menu from "../components/menu";
import Rodape from "../components/rodape";
import styles from "../styles/Contato.module.css";
import Link from "next/link";
import GoogleMap from "../components/map";
import Box from "@mui/material/Box";
import { createTheme, ThemeProvider } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import TextField from "@mui/material/TextField";
import InputLabel from "@mui/material/InputLabel";
import MenuItem from "@mui/material/MenuItem";
import FormControl from "@mui/material/FormControl";
import Select from "@mui/material/Select";
import Button from "@mui/material/Button";
import MuiAlert from "@mui/material/Alert";
import Snackbar from "@mui/material/Snackbar";

const Alert = React.forwardRef(function Alert(props, ref) {
  return <MuiAlert elevation={6} ref={ref} variant="filled" {...props} />;
});

const theme = createTheme({
  palette: {
    primary: {
      main: "#322783",
    },
    secondary: {
      main: "#db9600",
    },
  },
});

export default function Contato() {
  const [nome, setNome] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [setor, setSetor] = React.useState("");
  const [mensagem, setMensagem] = React.useState("");
  const [showAlertSuccess, setShowAlertSuccess] = React.useState(false);
  const [showAlertDanger, setShowAlertDanger] = React.useState(false);
  const [error, setError] = React.useState({});
  const [disableButton, setDisableButton] = React.useState(false);

  const handleSubmit = (event) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);

    const nome = data.get("nome");
    const email = data.get("email");
    const setor = data.get("setor");

    let isValid = true;
    const newError = { ...error };

    if (email.trim() === "") {
      newError.email = true;
      isValid = false;
    }

    if (nome.trim() === "") {
      newError.nome = true;
      isValid = false;
    }

    if (setor.trim() === "") {
      newError.setor = true;
      isValid = false;
    }

    setError(newError);

    if (!isValid) return;

    setDisableButton(true);

    SendContato({
      nome,
      email,
      setor,
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
        setSetor("");
        setMensagem("");
        setDisableButton(false);
      });
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Menu />
      <section className={styles.background3} style={{ paddingBottom: "0px" }}>
        
      </section>

      <section className={styles.background}>
        <div className={styles.interno2}>
          <div className={styles.box2}>
            <img
            src="/static/images/telefone.png"
            />
            <h3>Quer falar por telefone?</h3>
            <p>+55 54 9 9977-5827</p>
          </div>
          <div className={styles.box2}>
          <img
            src="/static/images/email.png"
            />
            <h3>Nosso E-mail</h3>
            <p>financeiro.cjstransportes@gmail.com</p>
          </div>
          <div className={styles.box2}>
          <img
            src="/static/images/mapa.png"
            />
            <h3>Te esperamos com café.</h3>
            <p>Veranópolis - RS, 95330-000 <br />
              Rodovia BR 470 KM 181 Bairro Vila Azul n° 91 </p>
          </div>
          </div>
      </section>
      <section style={{ paddingTop: "8rem" }} className={styles.background}>
        <div className={styles.interno}>
          <div
            className={styles.box_row}
            style={{ justifyContent: "flex-start" }}
          >
            <div className={styles.box}>
              <h2 className={styles.titulo}>
                Nossa equipe está pronta para ajudar você.
              </h2>
             <p>
             Aqui na CJS Transportes, unimos experiência, eficiência e inovação para proporcionar soluções de transporte de excelência aos nossos clientes. Combinando estratégia, logística de ponta, e um compromisso sólido com a satisfação do cliente, estamos prontos para atender às suas necessidades de transporte de forma confiável e eficaz. Nossa abordagem moderna e foco na tecnologia nos permite otimizar cada etapa da entrega, garantindo que sua carga chegue ao destino com segurança e no prazo. Conte conosco para fazer a diferença no seu negócio
             </p>
            </div>

            <div className={` ${styles.mobile}`}>
              <div
                className={` ${styles.box}`}
                style={{ alignItems: "flex-start" }}
              >
                <h3>Deixe um recado!</h3>
                <p className={styles.p} style={{ marginBottom: "2rem" }}>
                  Nossa equipe irá avalia seu recado e reponder o mais breve
                  possível
                </p>

                <Box
                  component="form"
                  sx={{ width: "100%" }}
                  noValidate
                  autoComplete="off"
                  onSubmit={handleSubmit}
                >
                  <div className="w-full flex flex-row sm:flex-nowrap flex-wrap justify-between items-center">
                    <TextField
                      value={nome || ""}
                      type="text"
                      margin="normal"
                      required
                      fullWidth
                      id="nome"
                      label="Nome"
                      name="nome"
                      autoFocus
                      onChange={(event) => setNome(event.target.value)}
                      sx={{ marginLeft: ".5rem", marginRight: ".5rem" }}
                      onFocus={() => {
                        const newError = { ...error };
                        newError.nome = false;
                        setError(newError);
                      }}
                      error={error.nome}
                      helperText={error.nome ? "campo obrigatório" : ""}
                    />

                    <TextField
                      value={email || ""}
                      type="text"
                      margin="normal"
                      required
                      fullWidth
                      id="email"
                      label="E-Mail"
                      name="email"
                      onChange={(event) => setEmail(event.target.value)}
                      sx={{ marginLeft: ".5rem", marginRight: ".5rem" }}
                      onFocus={() => {
                        const newError = { ...error };
                        newError.email = false;
                        setError(newError);
                      }}
                      error={error.email}
                      helperText={error.email ? "campo obrigatório" : ""}
                    />
                  </div>
                  <div className="w-full flex flex-row sm:flex-nowrap flex-wrap justify-between items-center">
                    <div
                      className="select-input w-full"
                      style={{ marginLeft: ".5rem", marginRight: ".5rem" }}
                    >
                      <FormControl fullWidth>
                        <InputLabel id="select-setor-label">Setor *</InputLabel>
                        <Select
                          labelId="select-setor-label"
                          id="setor"
                          name="setor"
                          value={setor || ""}
                          label="Setor *"
                          required
                          error={error.setor}
                          onChange={(event) => setSetor(event.target.value)}
                          onFocus={() => {
                            const newError = { ...error };
                            newError.setor = false;
                            setError(newError);
                          }}
                        >
                          <MenuItem key={"comercial"} value={"comercial"}>
                            Comercial
                          </MenuItem>
                          <MenuItem key={"financeiro"} value={"financeiro"}>
                            Financeiro
                          </MenuItem>
                        </Select>
                        {error.setor && (
                          <p className="select-error" id="setor-helper-text">
                            campo obrigatório
                          </p>
                        )}
                      </FormControl>
                    </div>
                  </div>
                  <div style={{ marginLeft: ".5rem", marginRight: ".5rem" }}>
                    <TextField
                      value={mensagem || ""}
                      type="text"
                      margin="normal"
                      fullWidth
                      id="mensagem"
                      label="Mensagem"
                      name="mensagem"
                      multiline
                      rows={4}
                      onChange={(event) => setMensagem(event.target.value)}
                    />
                  </div>
                  <div style={{ marginRight: ".5rem" }}>
                    <Button
                      type="submit"
                      fullWidth
                      variant="contained"
                      className="bg-[#db9600] hover:bg-[#25c262] text-white mx-[.5rem] p-4 mt-2 font-bold border-0  cursor-pointer"
                      sx={{ marginLeft: 0, marginRight: 0 }}
                      disabled={disableButton}
                    >
                      ENVIAR AGORA
                    </Button>
                  </div>
                </Box>
              </div>
            </div>
          </div>
        </div>
      </section>
      <section className={styles.background} style={{ paddingTop: "8rem" }}>
        <GoogleMap />
      </section>
      <Rodape />
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
          Não foi possível enviar o contato!
        </Alert>
      </Snackbar>
    </ThemeProvider>
  );
}
