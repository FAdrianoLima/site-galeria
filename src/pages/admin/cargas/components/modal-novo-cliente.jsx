import * as React from "react";
import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import styles from "../../../../styles/admin/Grupo.Usuarios.module.css";
import { VerificaSeClienteExiste } from "../../../../services/clientes";
import { validarCNPJ, validarCPF } from "../../../../services/globals";
import Backdrop from "@mui/material/Backdrop";
import CircularProgress from "@mui/material/CircularProgress";

const validacaoCpfCnpj = (valor) => {
  if (valor.trim() === "") return true;

  const cpfCnpj = valor.replace(/[^\d]+/g, "");

  if (cpfCnpj.length === 11) {
    return validarCPF({ cpf: cpfCnpj });
  } else if (cpfCnpj.length === 14) {
    return validarCNPJ({ cnpj: cpfCnpj });
  } else {
    return false;
  }
};

const formataCpfCnpj = (valor) => {
  const cpfCnpj = valor.replace(/[^\d]+/g, "");

  if (cpfCnpj.length === 11) {
    return cpfCnpj.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
  } else if (cpfCnpj.length === 14) {
    return cpfCnpj.replace(
      /^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/,
      "$1.$2.$3/$4-$5"
    );
  } else {
    return valor;
  }
};

export default function ModalDialogNovoCliente({
  open = false,
  handleClose,
  handleGravar,
}) {
  const [cpfCnpj, setCpfCnpj] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [nome, setNome] = React.useState("");
  const [error, setError] = React.useState({});
  const [backdrop, setBackDrop] = React.useState(false);

  React.useEffect(() => {
    if (open) {
      setCpfCnpj("");
      setEmail("");
      setNome("");
      setError({});
    }
  }, [open]);

  return (
    <Dialog open={open} onClose={handleClose} maxWidth={"md"} fullWidth={true}>
      <DialogTitle>Novo Cliente</DialogTitle>
      <DialogContent>
        <Backdrop
          sx={{ color: "#fff", zIndex: (theme) => theme.zIndex.drawer + 1 }}
          open={backdrop}
        >
          <CircularProgress color="inherit" />
        </Backdrop>
        <div className={styles.row}>
          <TextField
            value={cpfCnpj || ""}
            type="text"
            margin="normal"
            required
            fullWidth
            id="cpfCnpj"
            label="CPF/CNPJ"
            name="cpfCnpj"
            onChange={(event) => setCpfCnpj(event.target.value)}
            onBlur={() => {
              const valorFormatado = formataCpfCnpj(cpfCnpj);

              if (validacaoCpfCnpj(valorFormatado)) {
                setCpfCnpj(valorFormatado);
              } else {
                const novoError = { ...error };
                novoError.cpfCnpj = true;
                setError(novoError);
              }
            }}
            onFocus={() => {
              const novoError = { ...error };
              delete novoError.cpfCnpj;
              setError(novoError);
            }}
            error={error.cpfCnpj}
            helperText={error.cpfCnpj ? "CPF/CNPJ inválido" : ""}
            sx={{ marginLeft: ".5rem", marginRight: ".5rem" }}
          />

          <TextField
            value={email || ""}
            type="text"
            margin="normal"
            fullWidth
            id="email"
            label="E-mail"
            name="email"
            onChange={(event) => setEmail(event.target.value)}
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
      </DialogContent>
      <DialogActions sx={{ px: "2rem", pb: "1rem" }}>
        <Button
          variant="contained"
          onClick={async (e) => {
            e.preventDefault();

            const novoError = { ...error };
            let possuiErros = false;

            if (cpfCnpj.trim() === "") {
              possuiErros = true;
              novoError.cpfCnpj = true;
            }

            if (nome.trim() === "") {
              possuiErros = true;
              novoError.nome = true;
            }

            if (possuiErros) {
              setError(novoError);
              return;
            }

            try {
              setBackDrop(true);

              const dadosCliente = {
                cpfCnpj,
                email,
                nome,
                endereco: "",
                numero: "",
                bairro: "",
                cidade: "",
                estado: "",
                cep: "",
              };

              await handleGravar(dadosCliente);

              setBackDrop(false);
              handleClose();
            } catch (e) {
              setBackDrop(false);
            }
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
