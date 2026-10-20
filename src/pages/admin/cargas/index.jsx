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
import TextField from "@mui/material/TextField";
import Stack from "@mui/material/Stack";
import IconButton from "@mui/material/IconButton";
import ModeEditIcon from "@mui/icons-material/ModeEdit";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import Tooltip from "@mui/material/Tooltip";
import FormGroup from "@mui/material/FormGroup";
import FormControlLabel from "@mui/material/FormControlLabel";
import Checkbox from "@mui/material/Checkbox";
import {
  ReadAll12Months as ReadAll,
  Delete,
  Update,
  Patch,
} from "../../../services/cargas";
import Backdrop from "@mui/material/Backdrop";
import CircularProgress from "@mui/material/CircularProgress";
import Link from "next/link";
import Swal from "sweetalert2";
import moment from "moment";
import FlagIcon from "@mui/icons-material/Flag";
import LocalShippingIcon from "@mui/icons-material/LocalShipping";
import DoneAllIcon from "@mui/icons-material/DoneAll";
import EventIcon from "@mui/icons-material/Event";
import EditNoteIcon from "@mui/icons-material/EditNote";
import { useRouter } from "next/router";
import AlterarDataHoraCarga from "../../../components/alterarDataCarga";
import ModalDialogEdicao from "./components/modal-edicao";

const Content = () => {
  const [cargas, setCargas] = React.useState([]);
  const [loader, setLoader] = React.useState(false);
  const [pesquisarNF, setPesquisaNF] = React.useState("");
  const [abrirModalDataHora, setAbrirModalDataHora] = React.useState(false);
  const [cargaSelecionada, setCargaSelecionada] = React.useState(null);
  const [abrirModalEdicao, setAbrirModalEdicao] = React.useState(false);

  const [recebido, setRecebido] = React.useState(false);
  const [emRota, setEmRota] = React.useState(false);
  const [entregue, setEntregue] = React.useState(false);

  const [cargaSelecionadaModal, setCargaSelecionadaModal] =
    React.useState(null);

  const router = useRouter();

  const loadValues = async () => {
    try {
      setLoader(true);

      let retornoCargas = await ReadAll();

      setCargas(retornoCargas);

      setLoader(false);
    } catch {
      setLoader(false);
    }
  };

  React.useEffect(() => {
    if (router.isReady) loadValues();
  }, [router]);

  React.useEffect(() => {
    if (cargaSelecionada !== null) {
      setAbrirModalDataHora(true);
    } else {
      setAbrirModalDataHora(false);
    }
  }, [cargaSelecionada]);

  React.useEffect(() => {
    setAbrirModalEdicao(cargaSelecionadaModal !== null);
  }, [cargaSelecionadaModal]);

  {
    /*Handler antigo
  
  
  const handleAlterarSituacao = async (
    id = "",
    carga = null,
    novaSituacao = ""
  ) => {
    try {
      setLoader(true);
      const novaCarga = { ...carga };
      novaCarga.situacao = novaSituacao;

      await Update(id, novaCarga);

      await loadValues();
    } catch (error) {
      setLoader(false);
    }
  };*/
  }
  const handleAlterarSituacao = async (
    id = "",
    carga = null,
    novaSituacao = "",
  ) => {
    try {
      // 1️⃣ Se não mudou, não faz nada
      if (!carga || carga.situacao === novaSituacao) return;

      setLoader(true);

      // 2️⃣ Atualiza situação no Firebase
      const novaCarga = {
        ...carga,
        situacao: novaSituacao,
      };

      await Update(id, novaCarga);

      // 3️⃣ Se tiver envio OCOREN configurado, envia
      if (carga.envioOcoren && carga.envioOcoren !== "nenhum") {
        const resp = await fetch("/.netlify/functions/sendOcoren", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            cargaId: id,
            envioOcoren: carga.envioOcoren,
          }),
        });

        const text = await resp.text();
        console.log("OCOREN retorno:", resp.status, text);

        if (!resp.ok) {
          Swal.fire({
            icon: "warning",
            title: "Carga atualizada",
            text: "Mas houve erro ao enviar OCOREN",
          });
        }
      }

      // 4️⃣ Recarrega lista
      await loadValues();
      setLoader(false);
    } catch (error) {
      console.error("Erro ao alterar situação:", error);
      setLoader(false);

      Swal.fire({
        icon: "error",
        title: "Erro",
        text: "Erro ao atualizar situação da carga",
      });
    }
  };

  const handleAlterarDataHora = async (id = "", dados = {}) => {
    try {
      setLoader(true);

      await Patch(id, dados);
      await loadValues();
    } catch (error) {
      setLoader(false);
    }

    setCargaSelecionada(null);
  };

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
                  colSpan={6}
                  style={{ paddingTop: "15px", paddingBottom: "15px" }}
                >
                  <ButtonGroup
                    aria-label="medium secondary button group"
                    sx={{
                      width: "100%",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <TextField
                      type="text"
                      margin="normal"
                      value={pesquisarNF}
                      label="Nº Nota Fiscal"
                      onChange={(e) => setPesquisaNF(e.target.value)}
                      sx={{
                        marginLeft: ".5rem",
                        marginRight: ".5rem",
                      }}
                    />
                    <FormGroup row>
                      <FormControlLabel
                        control={
                          <Checkbox
                            checked={recebido}
                            onChange={() => setRecebido(!recebido)}
                            name="recebido"
                          />
                        }
                        label="Recebido / Coletado"
                      />

                      <FormControlLabel
                        control={
                          <Checkbox
                            checked={emRota}
                            onChange={() => setEmRota(!emRota)}
                            name="em_rota"
                          />
                        }
                        label="Em rota de entrega"
                      />

                      <FormControlLabel
                        control={
                          <Checkbox
                            checked={entregue}
                            onChange={() => setEntregue(!entregue)}
                            name="entregue"
                          />
                        }
                        label="Entregue"
                      />
                    </FormGroup>

                    <Link href="/admin/cargas/null" passHref>
                      <Button
                        color="primary"
                        variant="contained"
                        startIcon={<AddIcon />}
                        sx={{
                          color: "white",
                          ":hover": { color: "white" },
                          height: "3rem",
                          display: "flex",
                        }}
                        className="buttonPrimary"
                      >
                        Adicionar
                      </Button>
                    </Link>
                  </ButtonGroup>
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell sx={{ width: "150px", fontWeight: "bold" }}>
                  Data/Hora
                </TableCell>
                <TableCell sx={{ fontWeight: "bold" }}>Cliente</TableCell>
                <TableCell sx={{ fontWeight: "bold" }}>Motorista</TableCell>
                <TableCell sx={{ fontWeight: "bold" }}>Nota Fiscal</TableCell>
                <TableCell sx={{ width: "200px", fontWeight: "bold" }}>
                  Situação
                </TableCell>
                <TableCell sx={{ width: "100px" }}>&nbsp;</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {(() => {
                const retorno = [];

                cargas
                  .filter((a) => {
                    let retorno = true;

                    if (pesquisarNF.trim() !== "") {
                      retorno = a.nrNotaFiscal.includes(pesquisarNF.trim());
                    }

                    if (
                      !recebido &&
                      (a.situacao === "deposito" || a.situacao === "recebido")
                    ) {
                      retorno = false;
                    }

                    if (
                      !emRota &&
                      (a.situacao === "em_transporte" ||
                        a.situacao === "em_rota")
                    ) {
                      retorno = false;
                    }

                    if (!entregue && a.situacao === "entregue") {
                      retorno = false;
                    }

                    return retorno;
                  })
                  .sort((a, b) => a.dataCadastro < b.dataCadastro)
                  .map((carga, index) => {
                    var corRecebido = "#d3d3d3";
                    var corEmRota = "#d3d3d3";
                    var corEntregue = "#d3d3d3";

                    switch (carga.situacao) {
                      case "deposito":
                      case "recebido":
                        corRecebido = "#3363AC";
                        break;

                      case "em_transporte":
                      case "em_rota":
                        corEmRota = "#db9600";
                        break;

                      case "entregue":
                        corEntregue = "#008000";
                        break;
                    }

                    retorno.push(
                      <TableRow key={index}>
                        <TableCell>
                          {moment(new Date(carga.dataCadastro)).format(
                            "DD/MM/YYYY HH:mm",
                          )}
                        </TableCell>
                        <TableCell>{carga.cliente.nome}</TableCell>
                        <TableCell>{carga.motorista}</TableCell>
                        <TableCell>
                          {carga.nrNotaFiscal.split(",").join(", ")}
                        </TableCell>
                        <TableCell>
                          <IconButton
                            sx={{ color: corRecebido }}
                            onClick={() =>
                              handleAlterarSituacao(carga.id, carga, "recebido")
                            }
                          >
                            <FlagIcon />
                          </IconButton>
                          <IconButton
                            sx={{ color: corEmRota }}
                            onClick={() =>
                              handleAlterarSituacao(carga.id, carga, "em_rota")
                            }
                          >
                            <LocalShippingIcon />
                          </IconButton>
                          <IconButton
                            sx={{ color: corEntregue }}
                            onClick={() =>
                              handleAlterarSituacao(carga.id, carga, "entregue")
                            }
                          >
                            <DoneAllIcon />
                          </IconButton>
                          <IconButton
                            onClick={() => setCargaSelecionada(carga)}
                          >
                            <EventIcon />
                          </IconButton>
                        </TableCell>

                        <TableCell>
                          <Stack direction="row" spacing={0}>
                            <Tooltip title="Edição Rápida" placement="top">
                              <IconButton
                                size="small"
                                onClick={() => {
                                  setCargaSelecionadaModal(carga);
                                }}
                              >
                                <EditNoteIcon
                                  fontSize="inherit"
                                  color="primary"
                                />
                              </IconButton>
                            </Tooltip>
                            <Link href={`/admin/cargas/${carga.id}`} passHref>
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
                                      "Deseja realmente excluir esta carga?",
                                    icon: "error",
                                    showDenyButton: true,
                                    confirmButtonText: "Sim",
                                    denyButtonText: "Não",
                                  }).then((retorno) => {
                                    const { value } = retorno;

                                    if (value) {
                                      setLoader(true);
                                      Delete(carga.id)
                                        .then(() => loadValues())
                                        .catch(() => setLoader(false));
                                    }
                                  });
                                }}
                              >
                                <DeleteIcon
                                  fontSize="inherit"
                                  color="primary"
                                />
                              </IconButton>
                            </Tooltip>
                          </Stack>
                        </TableCell>
                      </TableRow>,
                    );
                  });

                if (retorno.length === 0) {
                  retorno.push(
                    <TableRow key={1}>
                      <TableCell
                        colSpan={6}
                        style={{ textAlign: "center", color: "lightgrey" }}
                      >
                        Sem registros cadastrados
                      </TableCell>
                    </TableRow>,
                  );
                }

                return retorno;
              })()}
            </TableBody>
          </Table>
        </TableContainer>
      </div>
      <AlterarDataHoraCarga
        open={abrirModalDataHora}
        carga={cargaSelecionada}
        handleClose={() => {
          setCargaSelecionada(null);
        }}
        handleGravar={handleAlterarDataHora}
      />
      <ModalDialogEdicao
        open={abrirModalEdicao}
        carga={cargaSelecionadaModal}
        handleClose={() => setCargaSelecionadaModal(null)}
        handleGravar={async (id, dados) => {
          try {
            setLoader(true);

            const novaCargas = [...cargas];
            const index = novaCargas.findIndex((a) => a.id === id);

            const novosDados = {
              ...cargaSelecionadaModal,
              ...dados,
            };

            setCargaSelecionadaModal(null);
            await Update(id, novosDados);

            novaCargas[index] = novosDados;

            setCargas(novaCargas);
            setLoader(false);
          } catch (e) {
            setLoader(false);
          }
        }}
      />
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
