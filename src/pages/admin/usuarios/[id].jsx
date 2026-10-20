import * as React from "react";
import Admin from "../../../components/admin";
import Paper from "@mui/material/Paper";
import Box from "@mui/material/Box";
import TextField from "@mui/material/TextField";
import InputLabel from "@mui/material/InputLabel";
import MenuItem from "@mui/material/MenuItem";
import FormControl from "@mui/material/FormControl";
import Select from "@mui/material/Select";
import Backdrop from "@mui/material/Backdrop";
import CircularProgress from "@mui/material/CircularProgress";
import styles from "../../../styles/admin/Grupo.Usuarios.module.css";
import Link from "next/link";
import { useRouter } from "next/router";
import Button from "@mui/material/Button";
import { Read, Create, Update } from "../../../services/usuarios";
import { ReadAll as ReadAllClientes } from "../../../services/clientes";

const Content = ({ toggleLoader }) => {
  const [error, setError] = React.useState({});
  const [disableButton, setDisableButton] = React.useState(false);
  const [id, setId] = React.useState(null);
  const [fbId, setFbId] = React.useState("");
  const [nome, setNome] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [senha, setSenha] = React.useState("");
  const [ativo, setAtivo] = React.useState(true);
  const [tipoDeUsuario, setTipoDeUsuario] = React.useState("C");
  const [clienteId, setClienteId] = React.useState(null);
  const [backdrop, setBackDrop] = React.useState(false);

  const [listaDeClientes, setListaDeClientes] = React.useState([]);

  const router = useRouter();

  const carregaDados = async (id) => {
    setBackDrop(true);
    try {
      if (id !== undefined && id !== "null") {
        const { status, data } = await Read({ id });

        if (status === 200) {
          setId(id);
          setFbId(data.fbId);
          setEmail(data.email);
          setSenha(data.senha);
          setNome(data.nome);
          setAtivo(data.ativo);
          setTipoDeUsuario(data.tipoDeUsuario);
          setClienteId(data.clienteId);
        }
      }

      const carregaDeClientes = await ReadAllClientes();
      setListaDeClientes(carregaDeClientes);
    } catch (error) {
      console.log(error);
    }

    setBackDrop(false);
  };

  React.useEffect(() => {
    if (router.isReady) {
      const { id } = router.query;

      carregaDados(id);
    }
  }, [router.isReady]);

  React.useEffect(() => {
    if (tipoDeUsuario !== "C") {
      setClienteId(null);
    }
  }, [tipoDeUsuario]);

  const handleSubmit = (event) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);

    let hasError = false;
    const newError = { ...error };

    if (data.get("email") !== null) {
      if (data.get("email").trim() === "") {
        newError.email = true;
        hasError = true;
      }
    }

    if (data.get("senha") !== null) {
      if (data.get("senha").trim() === "") {
        newError.senha = true;
        hasError = true;
      }
    }

    if (data.get("nome").trim() === "") {
      newError.nome = true;
      hasError = true;
    }

    if (hasError) {
      setError(newError);
      return;
    }

    const params = {
      fbId,
      nome,
      email,
      senha,
      ativo,
      tipoDeUsuario,
      clienteId,
    };

    toggleLoader({ value: true });
    setDisableButton(true);

    let promise = undefined;

    if (id === null) {
      promise = Create(params);
    } else {
      promise = Update({ id, ...params });
    }

    promise.then((retorno) => {
      if (retorno.status === 200) {
        router.push("/admin/usuarios");
      }
    });
  };

  return (
    <Paper className="paper">
      <div className="root">
        <Backdrop
          sx={{ color: "#fff", zIndex: (theme) => theme.zIndex.drawer + 1 }}
          open={backdrop}
        >
          <CircularProgress color="inherit" />
        </Backdrop>

        <Box
          id="form"
          component="form"
          autoComplete="off"
          noValidate
          onSubmit={handleSubmit}
          sx={{ width: "100%" }}
        >
          <div className={styles.col}>
            <span className="voltar">
              <Link href="/admin/usuarios">&#171;&nbsp;Voltar</Link>
            </span>
            <h5 style={{ marginLeft: ".5rem" }}>Editar Usuário</h5>
            <div className={styles.row}>
              <TextField
                value={email || ""}
                type="text"
                margin="normal"
                required
                fullWidth
                id="email"
                label="E-mail"
                name="email"
                autoComplete="email"
                autoFocus
                disabled={id !== null}
                onChange={(event) => {
                  if (id === null) {
                    setEmail(event.target.value);
                  }
                }}
                onFocus={() => {
                  const newError = { ...error };
                  newError.email = false;
                  setError(newError);
                }}
                error={error.email}
                helperText={error.email ? "campo obrigatório" : ""}
                sx={{ marginLeft: ".5rem", marginRight: ".5rem" }}
              />
              <TextField
                value={senha}
                margin="normal"
                required
                fullWidth
                type="password"
                id="senha"
                label="Senha"
                name="senha"
                autoComplete="new-password"
                disabled={id !== null}
                onChange={(event) => {
                  if (id === null) {
                    setSenha(event.target.value);
                  }
                }}
                onFocus={() => {
                  const newError = { ...error };
                  newError.senha = false;
                  setError(newError);
                }}
                error={error.senha}
                helperText={error.senha ? "campo obrigatório" : ""}
                sx={{ marginLeft: ".5rem", marginRight: ".5rem" }}
              />
            </div>
            <div className={styles.row}>
              <TextField
                value={nome || ""}
                margin="normal"
                required
                fullWidth
                id="nome"
                label="Nome"
                name="nome"
                autoComplete="nome"
                onChange={(event) => setNome(event.target.value)}
                onFocus={() => {
                  const newError = { ...error };
                  newError.nome = false;
                  setError(newError);
                }}
                error={error.nome}
                helperText={error.nome ? "campo obrigatório" : ""}
                sx={{ marginLeft: ".5rem", marginRight: ".5rem" }}
              />
            </div>
            <div
              className={styles.row}
              style={{ justifyContent: "flex-start" }}
            >
              <div
                className="select-input"
                style={{
                  marginLeft: ".5rem",
                  marginRight: ".5rem",
                  width: "7.5rem",
                }}
              >
                <FormControl fullWidth>
                  <InputLabel id="select-ativo-label">Ativo</InputLabel>
                  <Select
                    labelId="select-ativo-label"
                    id="ativo"
                    name="ativo"
                    value={ativo}
                    label="Ativo"
                    onChange={(event) => setAtivo(event.target.value)}
                  >
                    <MenuItem value={false}>Não</MenuItem>
                    <MenuItem value={true} selected>
                      Sim
                    </MenuItem>
                  </Select>
                </FormControl>
              </div>
              <div
                className="select-input"
                style={{
                  marginLeft: ".5rem",
                  marginRight: ".5rem",
                  width: "12rem",
                }}
              >
                <FormControl fullWidth>
                  <InputLabel id="select-tipo-de-usuario-label">
                    Tipo de Usuário
                  </InputLabel>
                  <Select
                    labelId="select-tipo-de-usuario-label"
                    id="tipoDeUsuario"
                    name="tipoDeUsuario"
                    value={tipoDeUsuario}
                    label="Tipo de Usuário"
                    onChange={(event) => setTipoDeUsuario(event.target.value)}
                  >
                    <MenuItem value={"A"}>Administrador</MenuItem>
                    <MenuItem value={"C"}>Cliente</MenuItem>
                  </Select>
                </FormControl>
              </div>
              {tipoDeUsuario === "C" && (
                <div
                  className="select-input"
                  style={{
                    marginLeft: ".5rem",
                    marginRight: ".5rem",
                    width: "100%",
                  }}
                >
                  <FormControl fullWidth>
                    <InputLabel id="select-cliente-label">Cliente</InputLabel>
                    <Select
                      labelId="select-cliente-label"
                      id="clienteId"
                      name="clienteId"
                      value={clienteId || ""}
                      label="Cliente"
                      onChange={(event) => setClienteId(event.target.value)}
                    >
                      {listaDeClientes.map((cliente) => (
                        <MenuItem
                          key={`cliente-${cliente.id}`}
                          value={cliente.id}
                        >
                          {cliente.nome}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </div>
              )}
            </div>

            <div style={{ width: "100%" }}>
              <Button
                type="submit"
                fullWidth
                variant="contained"
                sx={{
                  mt: 3,
                  mb: 2,
                  maxWidth: "15rem",
                  marginLeft: ".5rem",
                  marginRight: ".5rem",
                  color: "white",
                  padding: ".8rem",
                }}
                disabled={disableButton}
              >
                Salvar
              </Button>
            </div>
          </div>
        </Box>
      </div>
    </Paper>
  );
};

export default function GrupoUsuarios() {
  const [loader, setLoader] = React.useState(false);
  const [permissao, setPermissao] = React.useState(false);
  const toggleLoader = ({ value = false }) => {
    setLoader(value);
  };

  const router = useRouter();

  React.useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user"));

    if (!user.ativo || user.tipoDeUsuario !== "A") {
      router.push("/admin");
    }
  }, []);

  return (
    <Admin showLoader={loader}>
      <Content toggleLoader={toggleLoader} />
    </Admin>
  );
}
