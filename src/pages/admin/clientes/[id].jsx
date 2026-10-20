import * as React from "react";

import Admin from "../../../components/admin";

import Paper from "@mui/material/Paper";
import Box from "@mui/material/Box";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import Backdrop from "@mui/material/Backdrop";
import CircularProgress from "@mui/material/CircularProgress";
import Divider from "@mui/material/Divider";
import Typography from "@mui/material/Typography";
import Stack from "@mui/material/Stack";

import PersonIcon from "@mui/icons-material/Person";
import ContactPhoneIcon from "@mui/icons-material/ContactPhone";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import NotesIcon from "@mui/icons-material/Notes";

import styles from "../../../styles/admin/Grupo.Usuarios.module.css";

import Link from "next/link";
import { useRouter } from "next/router";

import {
  Read,
  Create,
  Update,
  VerificaSeClienteExiste,
  GetAddressFromCep,
} from "../../../services/clientes";

import { validarCNPJ, validarCPF } from "../../../services/globals";

import Swal from "sweetalert2";

// ============================================================
// CPF / CNPJ
// ============================================================
const aplicarMascara = (valor, tipo) => {
  const numeros = somenteNumeros(valor);

  if (tipo === "telefone") {
    if (numeros.length <= 10) {
      return numeros
        .slice(0, 10)
        .replace(/^(\d{2})(\d)/, "($1) $2")
        .replace(/(\d{4})(\d)/, "$1-$2");
    }

    return numeros
      .slice(0, 11)
      .replace(/^(\d{2})(\d)/, "($1) $2")
      .replace(/(\d{5})(\d)/, "$1-$2");
  }

  if (tipo === "cep") {
    return numeros.slice(0, 8).replace(/^(\d{5})(\d)/, "$1-$2");
  }

  return valor;
};

const somenteNumeros = (valor = "") => {
  return String(valor).replace(/[^\d]+/g, "");
};

const validacaoCpfCnpj = (valor) => {
  if (!valor || valor.trim() === "") {
    return true;
  }

  const cpfCnpj = somenteNumeros(valor);

  if (cpfCnpj.length === 11) {
    return validarCPF({
      cpf: cpfCnpj,
    });
  }

  if (cpfCnpj.length === 14) {
    return validarCNPJ({
      cnpj: cpfCnpj,
    });
  }

  return false;
};

const formataCpfCnpj = (valor) => {
  const cpfCnpj = somenteNumeros(valor);

  if (cpfCnpj.length === 11) {
    return cpfCnpj.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
  }

  if (cpfCnpj.length === 14) {
    return cpfCnpj.replace(
      /^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/,
      "$1.$2.$3/$4-$5",
    );
  }

  return valor;
};

// ============================================================
// COMPONENTE DE TÍTULO DE SEÇÃO
// ============================================================

const SectionTitle = ({ icon, title, description }) => {
  return (
    <Stack
      direction="row"
      spacing={1.5}
      alignItems="center"
      sx={{
        mb: 2,
        mt: 1,
      }}
    >
      <Box
        sx={{
          width: 38,
          height: 38,
          borderRadius: 2,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#8B5CF6",
          backgroundColor: "#F3EEFF",
        }}
      >
        {icon}
      </Box>

      <Box>
        <Typography
          sx={{
            fontWeight: 700,
            color: "#29242E",
          }}
        >
          {title}
        </Typography>

        {description && (
          <Typography variant="caption" color="text.secondary">
            {description}
          </Typography>
        )}
      </Box>
    </Stack>
  );
};

// ============================================================
// FORMULÁRIO
// ============================================================

const Content = () => {
  const router = useRouter();

  const [backdrop, setBackDrop] = React.useState(false);

  const [id, setId] = React.useState(null);

  const [error, setError] = React.useState({});

  // ----------------------------------------------------------
  // Dados pessoais
  // ----------------------------------------------------------

  const [cpfCnpj, setCpfCnpj] = React.useState("");
  const [nome, setNome] = React.useState("");
  const [dataNascimento, setDataNascimento] = React.useState("");

  // ----------------------------------------------------------
  // Contato
  // ----------------------------------------------------------

  const [telefone, setTelefone] = React.useState("");
  const [whatsapp, setWhatsapp] = React.useState("");
  const [email, setEmail] = React.useState("");

  // ----------------------------------------------------------
  // Endereço
  // ----------------------------------------------------------

  const [cep, setCep] = React.useState("");
  const [endereco, setEndereco] = React.useState("");
  const [numero, setNumero] = React.useState("");
  const [bairro, setBairro] = React.useState("");
  const [cidade, setCidade] = React.useState("");
  const [estado, setEstado] = React.useState("RS");

  // ----------------------------------------------------------
  // Observações
  // ----------------------------------------------------------

  const [observacoes, setObservacoes] = React.useState("");

  // ==========================================================
  // CARREGAR CLIENTE
  // ==========================================================

  const carregaCliente = async (clienteId = null) => {
    try {
      if (
        clienteId === null ||
        clienteId === undefined ||
        clienteId === "null"
      ) {
        return;
      }

      setBackDrop(true);

      const retornoCliente = await Read(clienteId);

      setId(clienteId);

      // Dados antigos
      setCpfCnpj(retornoCliente.cpfCnpj || "");
      setNome(retornoCliente.nome || "");

      setEmail(retornoCliente.email || "");

      setEndereco(retornoCliente.endereco || "");
      setNumero(retornoCliente.numero || "");
      setBairro(retornoCliente.bairro || "");
      setCidade(retornoCliente.cidade || "");
      setEstado(retornoCliente.estado || "RS");
      setCep(retornoCliente.cep || "");

      // Novos dados
      setDataNascimento(retornoCliente.dataNascimento || "");

      setTelefone(retornoCliente.telefone || retornoCliente.celular || "");

      setWhatsapp(retornoCliente.whatsapp || "");

      setObservacoes(retornoCliente.observacoes || "");
    } catch (error) {
      console.error("Erro ao carregar cliente:", error);

      Swal.fire({
        title: "Erro",
        text: error?.message || "Não foi possível carregar o cliente.",
        icon: "error",
        confirmButtonText: "Ok",
      });
    } finally {
      setBackDrop(false);
    }
  };

  // ==========================================================
  // CARREGAR PELO ID DA URL
  // ==========================================================

  React.useEffect(() => {
    if (!router.isReady) return;

    const clienteId = router.query.id;

    if (typeof clienteId !== "string") return;

    if (clienteId === "novo") {
      setId(null);
      return;
    }

    if (clienteId === "null" || clienteId === "undefined") {
      router.replace("/admin/clientes");
      return;
    }

    carregaCliente(clienteId);
  }, [router.isReady, router.query.id]);
  // ==========================================================
  // BUSCAR CEP
  // ==========================================================

  const buscarCep = async () => {
    const cepLimpo = somenteNumeros(cep);

    if (cepLimpo.length !== 8) {
      return;
    }

    try {
      setBackDrop(true);

      const retorno = await GetAddressFromCep({
        cep: cepLimpo,
      });

      const dados = retorno?.data;

      if (!dados || dados.erro) {
        Swal.fire({
          title: "CEP não encontrado",
          text: "Verifique o CEP informado.",
          icon: "warning",
          confirmButtonText: "Ok",
        });

        return;
      }

      setEndereco(dados.logradouro || "");
      setBairro(dados.bairro || "");
      setCidade(dados.localidade || "");
      setEstado(dados.uf || "");
    } catch (error) {
      console.error("Erro ao buscar CEP:", error);

      Swal.fire({
        title: "Erro",
        text: "Não foi possível consultar o CEP.",
        icon: "error",
        confirmButtonText: "Ok",
      });
    } finally {
      setBackDrop(false);
    }
  };

  // ==========================================================
  // SUBMIT
  // ==========================================================

  const handleSubmit = async (event) => {
    event.preventDefault();

    const novoError = {};

    let possuiErros = false;

    // --------------------------------------------------------
    // Nome
    // --------------------------------------------------------

    if (!nome.trim()) {
      novoError.nome = true;
      possuiErros = true;
    }

    // --------------------------------------------------------
    // CPF/CNPJ
    // --------------------------------------------------------

    if (cpfCnpj.trim()) {
      if (!validacaoCpfCnpj(cpfCnpj)) {
        novoError.cpfCnpj = true;
        possuiErros = true;
      }
    }

    // --------------------------------------------------------
    // Email
    // --------------------------------------------------------

    if (email.trim()) {
      const emailValido = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());

      if (!emailValido) {
        novoError.email = true;
        possuiErros = true;
      }
    }

    setError(novoError);

    if (possuiErros) {
      return;
    }

    try {
      setBackDrop(true);

      // ------------------------------------------------------
      // Dados enviados para o Firestore
      // ------------------------------------------------------

      const dadosCliente = {
        cpfCnpj: cpfCnpj.trim(),
        nome: nome.trim(),

        dataNascimento: dataNascimento || "",

        telefone: somenteNumeros(telefone),

        whatsapp: somenteNumeros(whatsapp),

        email: email.trim(),

        endereco: endereco.trim(),
        numero: numero.trim(),
        bairro: bairro.trim(),
        cidade: cidade.trim(),
        estado: estado.trim().toUpperCase(),
        cep: somenteNumeros(cep),

        observacoes: observacoes.trim(),

        ativo: true,
      };

      // ------------------------------------------------------
      // Atualizar
      // ------------------------------------------------------

      if (id) {
        await Update(id, dadosCliente);
      }

      // ------------------------------------------------------
      // Criar
      // ------------------------------------------------------
      else {
        if (dadosCliente.cpfCnpj) {
          const verificaCliente = await VerificaSeClienteExiste(
            dadosCliente.cpfCnpj,
          );

          if (verificaCliente) {
            throw new Error(
              "Já existe um cliente cadastrado com este CPF/CNPJ.",
            );
          }
        }

        await Create(dadosCliente);
      }

      await Swal.fire({
        title: id ? "Cliente atualizado!" : "Cliente cadastrado!",
        text: id
          ? "Os dados do cliente foram atualizados com sucesso."
          : "O cliente foi cadastrado com sucesso.",
        icon: "success",
        timer: 1800,
        showConfirmButton: false,
      });

      router.push("/admin/clientes");
    } catch (error) {
      console.error("Erro ao salvar cliente:", error);

      Swal.fire({
        title: "Ops! Ocorreu um erro.",
        text: error?.message || "Não foi possível salvar o cliente.",
        icon: "error",
        confirmButtonText: "Ok",
      });
    } finally {
      setBackDrop(false);
    }
  };

  // ==========================================================
  // RENDER
  // ==========================================================

  return (
    <Paper
      elevation={0}
      sx={{
        width: "100%",
        borderRadius: 3,
        overflow: "hidden",
      }}
    >
      <Backdrop
        sx={{
          color: "#fff",
          zIndex: (theme) => theme.zIndex.drawer + 1,
        }}
        open={backdrop}
      >
        <CircularProgress color="inherit" />
      </Backdrop>

      <Box
        sx={{
          p: {
            xs: 2,
            md: 3,
          },
        }}
      >
        {/* ==================================================
            CABEÇALHO
        ================================================== */}

        <Box sx={{ mb: 3 }}>
          <Link
            href="/admin/clientes"
            style={{
              textDecoration: "none",
              color: "#8B5CF6",
              fontSize: 14,
              fontWeight: 600,
            }}
          >
            ← Voltar para clientes
          </Link>

          <Typography
            variant="h5"
            sx={{
              mt: 1.5,
              fontWeight: 700,
              color: "#29242E",
            }}
          >
            {id ? "Editar cliente" : "Novo cliente"}
          </Typography>

          <Typography
            variant="body2"
            color="text.secondary"
            sx={{
              mt: 0.5,
            }}
          >
            {id
              ? "Atualize os dados cadastrais e informações de contato."
              : "Cadastre os dados do cliente para utilizar na agenda e nos atendimentos."}
          </Typography>
        </Box>

        <Divider sx={{ mb: 3 }} />

        <Box
          component="form"
          autoComplete="off"
          noValidate
          onSubmit={handleSubmit}
        >
          {/* =================================================
              DADOS PESSOAIS
          ================================================= */}

          <SectionTitle
            icon={<PersonIcon />}
            title="Dados pessoais"
            description="Informações básicas do cliente"
          />

          <Stack
            direction={{
              xs: "column",
              md: "row",
            }}
            spacing={2}
            sx={{ mb: 4 }}
          >
            <TextField
              fullWidth
              required
              label="Nome completo"
              value={nome}
              onChange={(event) => setNome(event.target.value)}
              error={!!error.nome}
              helperText={error.nome ? "Informe o nome do cliente." : ""}
              onFocus={() => {
                setError((atual) => ({
                  ...atual,
                  nome: false,
                }));
              }}
            />

            <TextField
              fullWidth
              label="CPF/CNPJ"
              value={cpfCnpj}
              onChange={(event) => setCpfCnpj(event.target.value)}
              onBlur={() => {
                if (!cpfCnpj.trim()) {
                  return;
                }

                const valorFormatado = formataCpfCnpj(cpfCnpj);

                if (validacaoCpfCnpj(valorFormatado)) {
                  setCpfCnpj(valorFormatado);
                } else {
                  setError((atual) => ({
                    ...atual,
                    cpfCnpj: true,
                  }));
                }
              }}
              onFocus={() => {
                setError((atual) => ({
                  ...atual,
                  cpfCnpj: false,
                }));
              }}
              error={!!error.cpfCnpj}
              helperText={error.cpfCnpj ? "CPF/CNPJ inválido." : ""}
            />

            <TextField
              fullWidth
              label="Data de nascimento"
              type="date"
              value={dataNascimento}
              onChange={(event) => setDataNascimento(event.target.value)}
              InputLabelProps={{
                shrink: true,
              }}
            />
          </Stack>

          {/* =================================================
              CONTATO
          ================================================= */}

          <SectionTitle
            icon={<ContactPhoneIcon />}
            title="Contato"
            description="Telefone e canais de comunicação"
          />

          <Stack
            direction={{
              xs: "column",
              md: "row",
            }}
            spacing={2}
            sx={{ mb: 4 }}
          >
            <TextField
              fullWidth
              label="Telefone"
              value={telefone}
              onChange={(event) =>
                setTelefone(aplicarMascara(event.target.value, "telefone"))
              }
            />

            <TextField
              fullWidth
              label="WhatsApp"
              value={whatsapp}
              onChange={(event) =>
                setWhatsapp(aplicarMascara(event.target.value, "telefone"))
              }
            />

            <TextField
              fullWidth
              label="E-mail"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              error={!!error.email}
              helperText={error.email ? "Informe um e-mail válido." : ""}
              onFocus={() => {
                setError((atual) => ({
                  ...atual,
                  email: false,
                }));
              }}
            />
          </Stack>

          {/* =================================================
              ENDEREÇO
          ================================================= */}

          <SectionTitle
            icon={<LocationOnIcon />}
            title="Endereço"
            description="Informações de localização do cliente"
          />

          <Stack
            direction={{
              xs: "column",
              md: "row",
            }}
            spacing={2}
            sx={{ mb: 2 }}
          >
            <TextField
              label="CEP"
              value={cep}
              onChange={(event) =>
                setCep(aplicarMascara(event.target.value, "cep"))
              }
              onBlur={buscarCep}
              sx={{
                width: {
                  xs: "100%",
                  md: "180px",
                },
              }}
            />

            <TextField
              fullWidth
              label="Endereço"
              value={endereco}
              onChange={(event) => setEndereco(event.target.value)}
            />

            <TextField
              label="Número"
              value={numero}
              onChange={(event) => setNumero(event.target.value)}
              sx={{
                width: {
                  xs: "100%",
                  md: "140px",
                },
              }}
            />
          </Stack>

          <Stack
            direction={{
              xs: "column",
              md: "row",
            }}
            spacing={2}
            sx={{ mb: 4 }}
          >
            <TextField
              fullWidth
              label="Bairro"
              value={bairro}
              onChange={(event) => setBairro(event.target.value)}
            />

            <TextField
              fullWidth
              label="Cidade"
              value={cidade}
              onChange={(event) => setCidade(event.target.value)}
            />

            <TextField
              label="Estado"
              value={estado}
              onChange={(event) =>
                setEstado(event.target.value.toUpperCase().substring(0, 2))
              }
              sx={{
                width: {
                  xs: "100%",
                  md: "120px",
                },
              }}
            />
          </Stack>

          {/* =================================================
              OBSERVAÇÕES
          ================================================= */}

          <SectionTitle
            icon={<NotesIcon />}
            title="Observações"
            description="Informações adicionais sobre o cliente"
          />

          <TextField
            fullWidth
            multiline
            minRows={4}
            label="Observações"
            placeholder="Digite informações importantes sobre o cliente..."
            value={observacoes}
            onChange={(event) => setObservacoes(event.target.value)}
            sx={{
              mb: 4,
            }}
          />

          {/* =================================================
              BOTÕES
          ================================================= */}

          <Divider sx={{ mb: 3 }} />

          <Stack
            direction={{
              xs: "column-reverse",
              sm: "row",
            }}
            spacing={2}
            justifyContent="flex-end"
          >
            <Link
              href="/admin/clientes"
              style={{
                textDecoration: "none",
              }}
            >
              <Button
                variant="outlined"
                fullWidth
                sx={{
                  minWidth: 130,
                  borderRadius: 2,
                  textTransform: "none",
                  fontWeight: 600,
                }}
              >
                Cancelar
              </Button>
            </Link>

            <Button
              type="submit"
              variant="contained"
              sx={{
                minWidth: 160,
                borderRadius: 2,
                textTransform: "none",
                fontWeight: 600,
                color: "#fff",
                background: "linear-gradient(135deg, #8B5CF6, #EC4899)",
                "&:hover": {
                  background: "linear-gradient(135deg, #7C3AED, #DB2777)",
                },
              }}
            >
              {id ? "Salvar alterações" : "Cadastrar cliente"}
            </Button>
          </Stack>
        </Box>
      </Box>
    </Paper>
  );
};

// ============================================================
// PÁGINA
// ============================================================

export default function Cliente() {
  return (
    <Admin>
      <Content />
    </Admin>
  );
}
