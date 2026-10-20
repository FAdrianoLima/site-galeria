import * as React from "react";
import Admin from "../../../components/admin";
import Paper from "@mui/material/Paper";
import Button from "@mui/material/Button";
import ButtonGroup from "@mui/material/ButtonGroup";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Stack from "@mui/material/Stack";
import IconButton from "@mui/material/IconButton";
import ModeEditIcon from "@mui/icons-material/ModeEdit";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import Tooltip from "@mui/material/Tooltip";
import { ReadAll, Delete } from "../../../services/usuarios";
import Backdrop from "@mui/material/Backdrop";
import CircularProgress from "@mui/material/CircularProgress";
import Link from "next/link";
import Swal from "sweetalert2";
import { useRouter } from "next/router";

const Content = () => {
  const [usuarios, setUsuarios] = React.useState([]);
  const [loader, setLoader] = React.useState(false);

  const loadValues = () => {
    setLoader(true);

    ReadAll()
      .then((retorno) => {
        const { data } = retorno;

        if (data !== undefined) {
          setUsuarios(data);
        }
      })
      .finally(() => setLoader(false));
  };

  React.useEffect(() => loadValues(), []);

  return (
    <Paper className="paper">
      <div className="root">
        <Backdrop
          sx={{ color: "#fff", zIndex: (theme) => theme.zIndex.drawer + 1 }}
          open={loader}
        >
          <CircularProgress color="inherit" />
        </Backdrop>
        <TableContainer component={Paper}>
          <Table sx={{ width: "100%", minWidth: "650px" }} size="small">
            <TableHead>
              <TableRow>
                <TableCell
                  colSpan={4}
                  style={{ paddingTop: "15px", paddingBottom: "15px" }}
                >
                  <ButtonGroup
                    aria-label="medium secondary button group"
                    sx={{ width: "100%", justifyContent: "flex-end" }}
                  >
                    <Link href="/admin/usuarios/null" passHref>
                      <Button
                        color="primary"
                        variant="contained"
                        startIcon={<AddIcon />}
                        sx={{ color: "white", ":hover": { color: "white" } }}
                        className="buttonPrimary"
                      >
                        Adicionar
                      </Button>
                    </Link>
                  </ButtonGroup>
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell sx={{ fontWeight: "bold", minWidth: "300px" }}>
                  Usuário
                </TableCell>
                <TableCell sx={{ fontWeight: "bold", minWidth: "500px" }}>
                  Nome
                </TableCell>
                <TableCell sx={{ fontWeight: "bold" }}>Situação</TableCell>
                <TableCell sx={{ width: "100px" }}>&nbsp;</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {(() => {
                const retorno = [];

                usuarios.map((usuario, index) => {
                  retorno.push(
                    <TableRow key={index}>
                      <TableCell>{usuario.email}</TableCell>
                      <TableCell>{usuario.nome}</TableCell>
                      <TableCell>
                        {usuario.ativo ? "Ativo" : "Inativo"}
                      </TableCell>
                      <TableCell>
                        <Stack direction="row" spacing={0}>
                          <Link href={`/admin/usuarios/${usuario.id}`}>
                            <Tooltip title="Editar" placement="top">
                              <IconButton size="small">
                                <ModeEditIcon
                                  fontSize="inherit"
                                  color="primary"
                                />
                              </IconButton>
                            </Tooltip>
                          </Link>

                          <Tooltip title="Excluir" placement="top">
                            <IconButton
                              size="small"
                              onClick={() => {
                                Swal.fire({
                                  title:
                                    "Deseja realmente excluir este segmento?",
                                  icon: "error",
                                  showDenyButton: true,
                                  confirmButtonText: "Sim",
                                  denyButtonText: "Não",
                                }).then((retorno) => {
                                  const { value } = retorno;

                                  if (value) {
                                    setLoader(true);
                                    Delete({ id: usuario.id }).finally(() =>
                                      loadValues()
                                    );
                                  }
                                });
                              }}
                            >
                              <DeleteIcon fontSize="inherit" color="primary" />
                            </IconButton>
                          </Tooltip>
                        </Stack>
                      </TableCell>
                    </TableRow>
                  );
                });

                if (retorno.length === 0) {
                  retorno.push(
                    <TableRow key={1}>
                      <TableCell
                        colSpan={4}
                        style={{ textAlign: "center", color: "lightgrey" }}
                      >
                        Sem registros cadastrados
                      </TableCell>
                    </TableRow>
                  );
                }

                return retorno;
              })()}
            </TableBody>
          </Table>
        </TableContainer>
      </div>
    </Paper>
  );
};

export default function Usuarios() {
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
