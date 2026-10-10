import * as React from "react";
import Admin from "../../../components/admin";
import Paper from "@mui/material/Paper";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Stack from "@mui/material/Stack";
import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";
import TextField from "@mui/material/TextField";
import InputAdornment from "@mui/material/InputAdornment";
import Typography from "@mui/material/Typography";
import Chip from "@mui/material/Chip";
import Avatar from "@mui/material/Avatar";
import Divider from "@mui/material/Divider";

import ModeEditIcon from "@mui/icons-material/ModeEdit";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import CachedIcon from "@mui/icons-material/Cached";
import SearchIcon from "@mui/icons-material/Search";
import WhatsAppIcon from "@mui/icons-material/WhatsApp";
import PersonIcon from "@mui/icons-material/Person";

import Backdrop from "@mui/material/Backdrop";
import CircularProgress from "@mui/material/CircularProgress";

import Link from "next/link";
import Swal from "sweetalert2";
import { useRouter } from "next/router";

import { ReadAll, Delete } from "../../../services/clientes";
import LocalStorageCache from "../../../services/localstorage.cache";

const Content = () => {
  const [clientes, setClientes] = React.useState([]);
  const [busca, setBusca] = React.useState("");
  const [loader, setLoader] = React.useState(false);

  const router = useRouter();

  // ============================================================
  // CARREGAR CLIENTES
  // ============================================================

  const loadValues = async () => {
    try {
      setLoader(true);

      const retornoClientes = await ReadAll();

      setClientes(retornoClientes || []);
    } catch (error) {
      console.error("Erro ao carregar clientes:", error);

      Swal.fire({
        title: "Erro",
        text: "Não foi possível carregar os clientes.",
        icon: "error",
        confirmButtonText: "Ok",
      });
    } finally {
      setLoader(false);
    }
  };

  React.useEffect(() => {
    if (router.isReady) {
      loadValues();
    }
  }, [router.isReady]);

  // ============================================================
  // NORMALIZAR TEXTO
  // ============================================================

  const normalizarTexto = (valor = "") => {
    return String(valor)
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");
  };

  // ============================================================
  // FORMATAR TELEFONE
  // ============================================================

  const formatarTelefone = (valor = "") => {
    const telefone = String(valor).replace(/\D/g, "");

    if (telefone.length === 11) {
      return telefone.replace(/^(\d{2})(\d{5})(\d{4})$/, "($1) $2-$3");
    }

    if (telefone.length === 10) {
      return telefone.replace(/^(\d{2})(\d{4})(\d{4})$/, "($1) $2-$3");
    }

    return valor || "-";
  };

  // ============================================================
  // TELEFONE DO CLIENTE
  // ============================================================

  const obterTelefone = (cliente) => {
    return (
      cliente.whatsapp ||
      cliente.telefone ||
      cliente.celular ||
      cliente.phone ||
      ""
    );
  };

  // ============================================================
  // CLIENTES FILTRADOS
  // ============================================================

  const clientesFiltrados = React.useMemo(() => {
    const termo = normalizarTexto(busca.trim());

    if (!termo) {
      return clientes;
    }

    return clientes.filter((cliente) => {
      const campos = [
        cliente.nome,
        cliente.cpfCnpj,
        cliente.email,
        cliente.telefone,
        cliente.whatsapp,
        cliente.celular,
      ];

      return campos.some((campo) => normalizarTexto(campo).includes(termo));
    });
  }, [clientes, busca]);

  // ============================================================
  // EXCLUIR CLIENTE
  // ============================================================

  const excluirCliente = (cliente) => {
    Swal.fire({
      title: "Excluir cliente?",
      text: `O cliente "${cliente.nome || "sem nome"}" será removido do cadastro.`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Sim, excluir",
      cancelButtonText: "Cancelar",
      reverseButtons: true,
    }).then(async (resultado) => {
      if (!resultado.isConfirmed) {
        return;
      }

      try {
        setLoader(true);

        await Delete(cliente.id);

        setClientes((lista) => lista.filter((item) => item.id !== cliente.id));

        Swal.fire({
          title: "Cliente excluído",
          text: "O cliente foi removido com sucesso.",
          icon: "success",
          timer: 1800,
          showConfirmButton: false,
        });
      } catch (error) {
        console.error(error);

        Swal.fire({
          title: "Erro",
          text: error?.message || "Não foi possível excluir o cliente.",
          icon: "error",
          confirmButtonText: "Ok",
        });
      } finally {
        setLoader(false);
      }
    });
  };

  // ============================================================
  // LIMPAR CACHE
  // ============================================================

  const limparCache = async () => {
    try {
      setLoader(true);

      const cache = new LocalStorageCache();

      cache.removeItem("clientes");

      await loadValues();
    } catch (error) {
      setLoader(false);
    }
  };

  // ============================================================
  // AVATAR
  // ============================================================

  const inicialNome = (nome = "") => {
    const partes = nome.trim().split(" ").filter(Boolean);

    if (partes.length === 0) {
      return "?";
    }

    if (partes.length === 1) {
      return partes[0].substring(0, 1).toUpperCase();
    }

    return (
      partes[0].substring(0, 1) + partes[partes.length - 1].substring(0, 1)
    ).toUpperCase();
  };

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
        open={loader}
      >
        <CircularProgress color="inherit" />
      </Backdrop>

      {/* ======================================================
          CABEÇALHO
      ====================================================== */}

      <Box
        sx={{
          p: { xs: 2, md: 3 },
        }}
      >
        <Stack
          direction={{ xs: "column", md: "row" }}
          justifyContent="space-between"
          alignItems={{ xs: "flex-start", md: "center" }}
          spacing={2}
        >
          <Box>
            <Typography
              variant="h5"
              sx={{
                fontWeight: 700,
                color: "#26212B",
              }}
            >
              Clientes
            </Typography>

            <Typography
              variant="body2"
              sx={{
                color: "text.secondary",
                mt: 0.5,
              }}
            >
              Gerencie os clientes e seus dados cadastrais.
            </Typography>
          </Box>

          <Stack
            direction={{ xs: "column", sm: "row" }}
            spacing={1}
            sx={{
              width: { xs: "100%", md: "auto" },
            }}
          >
            <Button
              variant="outlined"
              startIcon={<CachedIcon />}
              onClick={limparCache}
              sx={{
                borderRadius: 2,
                textTransform: "none",
                fontWeight: 600,
              }}
            >
              Atualizar
            </Button>

            <Link
              href="/admin/clientes/novo"
              passHref
              style={{
                textDecoration: "none",
              }}
            >
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                sx={{
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
                Novo cliente
              </Button>
            </Link>
          </Stack>
        </Stack>

        {/* ====================================================
            RESUMO
        ==================================================== */}

        <Stack
          direction="row"
          spacing={1}
          sx={{
            mt: 3,
            alignItems: "center",
          }}
        >
          <Chip
            icon={<PersonIcon />}
            label={`${clientes.length} ${
              clientes.length === 1
                ? "cliente cadastrado"
                : "clientes cadastrados"
            }`}
            sx={{
              borderRadius: 2,
              fontWeight: 600,
            }}
          />

          {busca && (
            <Chip
              label={`${clientesFiltrados.length} encontrado(s)`}
              variant="outlined"
              sx={{
                borderRadius: 2,
              }}
            />
          )}
        </Stack>
      </Box>

      <Divider />

      {/* ======================================================
          BUSCA
      ====================================================== */}

      <Box
        sx={{
          px: { xs: 2, md: 3 },
          py: 2,
          backgroundColor: "#FAFAFC",
        }}
      >
        <TextField
          fullWidth
          value={busca}
          onChange={(event) => setBusca(event.target.value)}
          placeholder="Buscar por nome, CPF, telefone ou e-mail..."
          size="small"
          sx={{
            maxWidth: 600,
            backgroundColor: "#fff",
            "& .MuiOutlinedInput-root": {
              borderRadius: 2,
            },
          }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon fontSize="small" color="action" />
              </InputAdornment>
            ),
          }}
        />
      </Box>

      {/* ======================================================
          TABELA
      ====================================================== */}

      <TableContainer
        sx={{
          width: "100%",
          overflowX: "auto",
        }}
      >
        <Table
          sx={{
            minWidth: 750,
          }}
        >
          <TableHead>
            <TableRow
              sx={{
                backgroundColor: "#FAFAFC",
              }}
            >
              <TableCell
                sx={{
                  fontWeight: 700,
                  color: "#5F5964",
                  borderBottom: "1px solid #eee",
                }}
              >
                Cliente
              </TableCell>

              <TableCell
                sx={{
                  fontWeight: 700,
                  color: "#5F5964",
                  borderBottom: "1px solid #eee",
                }}
              >
                CPF/CNPJ
              </TableCell>

              <TableCell
                sx={{
                  fontWeight: 700,
                  color: "#5F5964",
                  borderBottom: "1px solid #eee",
                }}
              >
                WhatsApp
              </TableCell>

              <TableCell
                sx={{
                  fontWeight: 700,
                  color: "#5F5964",
                  borderBottom: "1px solid #eee",
                }}
              >
                E-mail
              </TableCell>

              <TableCell
                align="right"
                sx={{
                  width: 120,
                  fontWeight: 700,
                  color: "#5F5964",
                  borderBottom: "1px solid #eee",
                }}
              >
                Ações
              </TableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {clientesFiltrados.length > 0 ? (
              clientesFiltrados.map((cliente) => {
                const telefone = obterTelefone(cliente);

                return (
                  <TableRow
                    key={cliente.id}
                    hover
                    sx={{
                      "&:last-child td": {
                        borderBottom: 0,
                      },
                    }}
                  >
                    {/* CLIENTE */}

                    <TableCell>
                      <Stack direction="row" spacing={1.5} alignItems="center">
                        <Avatar
                          sx={{
                            width: 40,
                            height: 40,
                            fontSize: 14,
                            fontWeight: 700,
                            background:
                              "linear-gradient(135deg, #8B5CF6, #EC4899)",
                          }}
                        >
                          {inicialNome(cliente.nome)}
                        </Avatar>

                        <Box>
                          <Typography
                            sx={{
                              fontWeight: 600,
                              color: "#29242E",
                            }}
                          >
                            {cliente.nome || "Cliente sem nome"}
                          </Typography>

                          {cliente.cidade && (
                            <Typography
                              variant="caption"
                              color="text.secondary"
                            >
                              {cliente.cidade}
                              {cliente.estado ? ` - ${cliente.estado}` : ""}
                            </Typography>
                          )}
                        </Box>
                      </Stack>
                    </TableCell>

                    {/* CPF */}

                    <TableCell>
                      <Typography variant="body2">
                        {cliente.cpfCnpj || "-"}
                      </Typography>
                    </TableCell>

                    {/* WHATSAPP */}

                    <TableCell>
                      {telefone ? (
                        <Stack
                          direction="row"
                          spacing={0.8}
                          alignItems="center"
                        >
                          <WhatsAppIcon
                            sx={{
                              fontSize: 18,
                              color: "#25D366",
                            }}
                          />

                          <Typography variant="body2">
                            {formatarTelefone(telefone)}
                          </Typography>
                        </Stack>
                      ) : (
                        <Typography variant="body2" color="text.secondary">
                          -
                        </Typography>
                      )}
                    </TableCell>

                    {/* EMAIL */}

                    <TableCell>
                      <Typography
                        variant="body2"
                        sx={{
                          maxWidth: 250,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {cliente.email || "-"}
                      </Typography>
                    </TableCell>

                    {/* AÇÕES */}

                    <TableCell align="right">
                      <Stack
                        direction="row"
                        spacing={0}
                        justifyContent="flex-end"
                      >
                        <Link
                          href={`/admin/clientes/${cliente.id}`}
                          passHref
                          style={{
                            textDecoration: "none",
                          }}
                        >
                          <Tooltip title="Editar cliente">
                            <IconButton size="small">
                              <ModeEditIcon fontSize="small" color="primary" />
                            </IconButton>
                          </Tooltip>
                        </Link>

                        <Tooltip title="Excluir cliente">
                          <IconButton
                            size="small"
                            onClick={() => excluirCliente(cliente)}
                          >
                            <DeleteIcon fontSize="small" color="error" />
                          </IconButton>
                        </Tooltip>
                      </Stack>
                    </TableCell>
                  </TableRow>
                );
              })
            ) : (
              <TableRow>
                <TableCell
                  colSpan={5}
                  sx={{
                    textAlign: "center",
                    py: 8,
                    color: "text.secondary",
                  }}
                >
                  <PersonIcon
                    sx={{
                      fontSize: 42,
                      opacity: 0.25,
                      mb: 1,
                    }}
                  />

                  <Typography
                    variant="body1"
                    sx={{
                      fontWeight: 600,
                    }}
                  >
                    {busca
                      ? "Nenhum cliente encontrado"
                      : "Nenhum cliente cadastrado"}
                  </Typography>

                  <Typography
                    variant="body2"
                    sx={{
                      mt: 0.5,
                    }}
                  >
                    {busca
                      ? "Tente buscar por outro nome, CPF, telefone ou e-mail."
                      : "Comece cadastrando o primeiro cliente."}
                  </Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Paper>
  );
};

// ============================================================
// PÁGINA
// ============================================================

export default function Clientes() {
  const router = useRouter();

  React.useEffect(() => {
    if (!router.isReady) {
      return;
    }

    try {
      const usuarioSalvo = localStorage.getItem("user");

      if (!usuarioSalvo) {
        router.push("/admin");
        return;
      }

      const user = JSON.parse(usuarioSalvo);

      if (!user || user.ativo === false) {
        router.push("/admin");
        return;
      }
    } catch (error) {
      console.error("Erro ao verificar usuário:", error);

      router.push("/admin");
    }
  }, [router.isReady]);

  return (
    <Admin>
      <Content />
    </Admin>
  );
}
