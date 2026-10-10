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
import { Create, Read, Update, Patch } from "../../../services/cargas";

import { UploadFotoCarga, ExcluirFotoCarga } from "../../../services/storage";

import * as ClientesService from "../../../services/clientes";
import moment from "moment/moment";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { TimePicker } from "@mui/x-date-pickers/TimePicker";
import { ptBR } from "@mui/x-date-pickers/locales";
import dayjs from "dayjs";
import Swal from "sweetalert2";

import Autocomplete from "@mui/material/Autocomplete";
import PersonAddIcon from "@mui/icons-material/PersonAdd";
import ModalDialogNovoCliente from "./components/modal-novo-cliente";

const Content = ({ toggleLoader }) => {
  const [error, setError] = React.useState({});
  const [backdrop, setBackDrop] = React.useState(false);
  const [id, setId] = React.useState(null);
  const [dataCadastro, setDataCadastro] = React.useState(new Date());
  const [horaCadastro, setHoraCadastro] = React.useState(new Date());
  const [descricao, setDescricao] = React.useState("");
  const [observacao, setObservacao] = React.useState("");
  const [idCliente, setIdCliente] = React.useState("");
  const [motorista, setMotorista] = React.useState("");
  const [situacao, setSituacao] = React.useState("recebido");
  const [nrNotaFiscal, setNrNotaFiscal] = React.useState("");
  const [serieNotaFiscal, setSerieNotaFiscal] = React.useState("5");
  const [textoOcorrencia, setTextoOcorrencia] = React.useState("");

  const [fotosExistentes, setFotosExistentes] = React.useState([]);
  const [fotosCarga, setFotosCarga] = React.useState([]);
  const [fotosPreview, setFotosPreview] = React.useState([]);

  const [listaClientes, setListaClientes] = React.useState([]);
  const [optionClientes, setOptionClientes] = React.useState([]);
  const [selectedCliente, setSelectedCliente] = React.useState({});
  const [openClienteModal, setOpenClienteModal] = React.useState(false);

  const [entregaAutomatica, setEntregaAutomatica] = React.useState(false);

  const router = useRouter();

  const [envioOcoren, setEnvioOcoren] = React.useState("nenhum");

  const carregaDados = async (cargaId = null) => {
    try {
      setBackDrop(true);

      await carregaClientes();

      if (cargaId !== null && cargaId !== undefined && cargaId !== "null") {
        const retornoCarga = await Read(cargaId);

        const novaDataCadastro = new Date(
          retornoCarga.dataCadastro.split(" ")[0],
        );

        const novaHoraCadastro = new Date(retornoCarga.dataCadastro);

        setId(cargaId);
        setDataCadastro(novaDataCadastro);
        setHoraCadastro(novaHoraCadastro);
        setDescricao(retornoCarga.descricao);
        setIdCliente(retornoCarga.cliente.id);
        setMotorista(retornoCarga.motorista);
        setSituacao(retornoCarga.situacao);
        setObservacao(retornoCarga.observacao);
        setNrNotaFiscal(retornoCarga.nrNotaFiscal);
        setSerieNotaFiscal(retornoCarga.serieNotaFiscal || "5");
        setTextoOcorrencia(retornoCarga.textoOcorrencia || "");
        setEnvioOcoren(retornoCarga.envioOcoren || "nenhum");

        // Fotos já cadastradas
        const fotos = retornoCarga.fotos || [];

        setFotosExistentes(
          fotos.map((foto) => {
            if (typeof foto === "string") {
              return {
                url: foto,
                nome: "",
              };
            }

            return foto;
          }),
        );
      }
    } catch (error) {
      console.log(error);
    }

    setBackDrop(false);
  };

  const carregaClientes = async () => {
    try {
      const retornoClientes = await ClientesService.ReadAll();
      setListaClientes(retornoClientes);

      const novoOptionClientes = retornoClientes.map((a) => {
        return {
          value: a.id,
          label: `${a.cpfCnpj} - ${a.nome}`,
        };
      });

      setOptionClientes(novoOptionClientes);
    } catch (error) {
      throw error;
    }
  };

  const handleGravarCliente = async (cliente) =>
    new Promise(async (resolve, reject) => {
      try {
        const novoID = await ClientesService.Create(cliente);

        await carregaClientes();

        Swal.fire({
          title: "Cliente adicionado com sucesso!",
          icon: "success",
          showDenyButton: false,
          confirmButtonText: "OK",
        });

        resolve();
      } catch (e) {
        reject(e);
      }
    });

  React.useEffect(() => {
    if (router.isReady) {
      const { id } = router.query;
      carregaDados(id);
    }
  }, [router.isReady]);

  React.useEffect(() => {
    if (optionClientes.length > 0) {
      const novoValor = optionClientes.find((a) => a.value === idCliente);
      setSelectedCliente(novoValor);
    }
  }, [idCliente, optionClientes]);

  const handleSelecionarFotos = (event) => {
    const arquivos = Array.from(event.target.files || []);

    if (arquivos.length === 0) {
      return;
    }

    const tiposPermitidos = [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/webp",
    ];

    const arquivoInvalido = arquivos.find(
      (arquivo) => !tiposPermitidos.includes(arquivo.type),
    );

    if (arquivoInvalido) {
      Swal.fire({
        icon: "warning",
        title: "Imagem inválida",
        text: "Use apenas JPG, PNG ou WEBP.",
      });

      event.target.value = "";
      return;
    }

    const arquivoMuitoGrande = arquivos.find(
      (arquivo) => arquivo.size > 15 * 1024 * 1024,
    );

    if (arquivoMuitoGrande) {
      Swal.fire({
        icon: "warning",
        title: "Imagem muito grande",
        text: "Cada imagem deve ter no máximo 15 MB.",
      });

      event.target.value = "";
      return;
    }

    // --------------------------------------------------
    // FOTO ADICIONADA = ENTREGA REALIZADA
    // --------------------------------------------------

    const agora = new Date();

    setSituacao("entregue");
    setDataCadastro(agora);
    setHoraCadastro(agora);
    setEntregaAutomatica(true);

    // --------------------------------------------------
    // ADICIONA AS FOTOS
    // --------------------------------------------------

    setFotosCarga((fotosAtuais) => [...fotosAtuais, ...arquivos]);

    const novosPreviews = arquivos.map((arquivo) => ({
      arquivo,
      url: URL.createObjectURL(arquivo),
    }));

    setFotosPreview((previewsAtuais) => [...previewsAtuais, ...novosPreviews]);

    event.target.value = "";
  };

  const handleRemoverFotoPreview = (index) => {
    setFotosPreview((fotos) => {
      const fotoRemovida = fotos[index];

      if (fotoRemovida?.url) {
        URL.revokeObjectURL(fotoRemovida.url);
      }

      const novasFotos = fotos.filter((_, i) => i !== index);

      if (novasFotos.length === 0) {
        setEntregaAutomatica(false);
      }

      return novasFotos;
    });

    setFotosCarga((fotos) => {
      const novasFotos = fotos.filter((_, i) => i !== index);

      if (novasFotos.length === 0) {
        setEntregaAutomatica(false);
      }

      return novasFotos;
    });
  };

  const handleExcluirFotoExistente = async (index) => {
    const foto = fotosExistentes[index];

    if (!foto) {
      return;
    }

    const resultado = await Swal.fire({
      icon: "warning",
      title: "Excluir foto?",
      text: "Essa foto será removida da carga.",
      showCancelButton: true,
      confirmButtonText: "Excluir",
      cancelButtonText: "Cancelar",
    });

    if (!resultado.isConfirmed) {
      return;
    }

    try {
      setBackDrop(true);

      if (foto.url) {
        await ExcluirFotoCarga(foto.url);
      }

      const novasFotos = fotosExistentes.filter((_, i) => i !== index);

      setFotosExistentes(novasFotos);

      if (id) {
        await Patch(id, {
          fotos: novasFotos,
        });
      }

      await Swal.fire({
        icon: "success",
        title: "Foto excluída",
        text: "A foto foi removida da carga.",
        timer: 1500,
        showConfirmButton: false,
      });
    } catch (error) {
      console.error("Erro ao excluir foto:", error);

      Swal.fire({
        icon: "error",
        title: "Erro",
        text: "Não foi possível excluir a foto.",
      });
    } finally {
      setBackDrop(false);
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const novoError = { ...error };
    let possuiErros = false;

    if (descricao.trim() === "") {
      possuiErros = true;
      novoError.descricao = true;
    }

    if (nrNotaFiscal.trim() === "") {
      possuiErros = true;
      novoError.nrNotaFiscal = true;
    }

    const cliente = listaClientes.find((a) => a.id === idCliente);

    if (!cliente) {
      possuiErros = true;
      novoError.idCliente = true;
    }

    if (possuiErros) {
      setError(novoError);
      return;
    }

    try {
      setBackDrop(true);

      // --------------------------------------------------
      // SE UMA FOTO FOI ADICIONADA, A ENTREGA É AUTOMÁTICA
      // --------------------------------------------------

      let dataFinal = dataCadastro;
      let horaFinal = horaCadastro;
      let situacaoFinal = situacao;

      if (entregaAutomatica && fotosCarga.length > 0) {
        situacaoFinal = "entregue";
        dataFinal = dataCadastro;
        horaFinal = horaCadastro;
      }

      const novoDataCadastro = moment(new Date(dataFinal)).format("YYYY-MM-DD");

      const novoHoraCadastro = moment(new Date(horaFinal)).format("HH:mm:ss");

      const dadosCarga = {
        dataCadastro: `${novoDataCadastro} ${novoHoraCadastro}`,
        descricao,
        observacao,
        textoOcorrencia,
        cliente,
        motorista,
        situacao: situacaoFinal,
        nrNotaFiscal,
        serieNotaFiscal,
        envioOcoren,
      };

      // -------------- SALVAR NO FIREBASE ---------------

      let cargaId = id;

      if (id) {
        await Update(id, dadosCarga);
      } else {
        cargaId = await Create(dadosCarga);
      }

      // -------------- SALVAR FOTOS ----------------

      if (fotosCarga.length > 0 && cargaId) {
        try {
          const novasFotos = await Promise.all(
            fotosCarga.map((arquivo) => UploadFotoCarga(arquivo, cargaId)),
          );

          const fotosValidas = novasFotos.filter(Boolean);

          if (fotosValidas.length > 0) {
            const fotosAtualizadas = [...fotosExistentes, ...fotosValidas];

            await Patch(cargaId, {
              fotos: fotosAtualizadas,
            });

            setFotosExistentes(fotosAtualizadas);
          }
        } catch (erroFotos) {
          console.error("Erro ao salvar fotos:", erroFotos);

          await Swal.fire({
            icon: "warning",
            title: "Carga salva",
            text: "A carga foi salva, mas ocorreu um erro ao salvar uma ou mais fotos.",
          });
        }
      }

      console.log("Carga salva com sucesso:", cargaId);

      // -------------- CHAMAR SENDOCOREN ----------------

      try {
        const resp = await fetch("/.netlify/functions/sendOcoren", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            cargaId,
            envioOcoren,
          }),
        });

        const text = await resp.text();

        console.log("DEBUG sendOcoren - body:", text);

        let data = null;

        try {
          data = JSON.parse(text);
        } catch (e) {
          console.warn("Resposta não-json:", e.message);
        }

        if (resp.ok) {
          await Swal.fire({
            icon: "success",
            title: "Carga criada",
            text: "Arquivo OCOREN enviado para o FTP com sucesso.",
          });
        } else {
          await Swal.fire({
            icon: "warning",
            title: "Carga criada, mas houve problema no OCOREN",
            text: data?.message || text,
          });
        }
      } catch (err) {
        console.error("Erro no fetch/sendOcoren:", err);

        await Swal.fire({
          icon: "error",
          title: "Erro ao enviar OCOREN",
          text: err.message,
        });
      }

      router.push("/admin/cargas");
    } catch (error) {
      console.log(error);
    }

    setBackDrop(false);
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
              <Link href="/admin/cargas">&#171;&nbsp;Voltar</Link>
            </span>
            <h5 style={{ marginLeft: ".5rem" }}>Editar Carga</h5>
            <div className={styles.row}>
              <TextField
                value={descricao || ""}
                type="text"
                margin="normal"
                required
                fullWidth
                id="descricao"
                label="Descrição"
                name="descricao"
                onChange={(event) => setDescricao(event.target.value)}
                onFocus={() => {
                  const novoError = { ...error };
                  delete novoError.descricao;
                  setError(novoError);
                }}
                error={error.descricao}
                helperText={error.descricao ? "campo obrigatório" : ""}
                sx={{ marginLeft: ".5rem", marginRight: ".5rem" }}
              />
              <div
                className="select-input"
                style={{
                  marginLeft: ".5rem",
                  marginRight: ".5rem",
                  width: "15rem",
                }}
              >
                <FormControl fullWidth>
                  <InputLabel id="select-situacao-label">Situação</InputLabel>
                  <Select
                    labelId="select-situacao-label"
                    id="situacao"
                    name="situacao"
                    value={situacao}
                    label="Situação"
                    onChange={(event) => setSituacao(event.target.value)}
                  >
                    <MenuItem value={"recebido"}>Recebido / Coletado</MenuItem>
                    <MenuItem value={"em_rota"}>Em rota de entrega</MenuItem>
                    <MenuItem value={"entregue"}>Entregue</MenuItem>
                  </Select>
                </FormControl>
              </div>
            </div>

            <div className={styles.row}>
              <LocalizationProvider
                dateAdapter={AdapterDayjs}
                localeText={
                  ptBR.components.MuiLocalizationProvider.defaultProps
                    .localeText
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
              <TextField
                value={motorista || ""}
                type="text"
                margin="normal"
                required
                fullWidth
                id="motorista"
                label="Motorista"
                name="motorista"
                onChange={(event) => setMotorista(event.target.value)}
                onFocus={() => {
                  const novoError = { ...error };
                  delete novoError.motorista;
                  setError(novoError);
                }}
                error={error.motorista}
                helperText={error.motorista ? "campo obrigatório" : ""}
                sx={{ marginLeft: ".5rem", marginRight: ".5rem" }}
              />
            </div>
            <div className={styles.row}>
              <FormControl
                fullWidth
                sx={{ mx: ".5rem", mt: "16px", mb: "8px" }}
              >
                <Autocomplete
                  value={selectedCliente}
                  options={optionClientes}
                  getOptionLabel={(option) => option.label}
                  onChange={(_, newValue) => {
                    if (newValue) {
                      setIdCliente(newValue.value);
                    } else {
                      setIdCliente("");
                    }
                  }}
                  renderInput={(params) => (
                    <TextField {...params} label="Cliente" />
                  )}
                />
              </FormControl>

              <Button
                type="button"
                variant="contained"
                sx={{
                  mt: 3,
                  mb: 2,
                  height: "52px",
                  marginLeft: ".5rem",
                  marginRight: ".5rem",
                  color: "white",
                }}
                onClick={() => setOpenClienteModal(!openClienteModal)}
              >
                <PersonAddIcon />
              </Button>

              <TextField
                value={nrNotaFiscal || ""}
                type="text"
                margin="normal"
                required
                id="nrNotaFiscal"
                label="Nº Nota Fiscal"
                name="nrNotaFiscal"
                onChange={(event) => setNrNotaFiscal(event.target.value)}
                onFocus={() => {
                  const novoError = { ...error };
                  delete novoError.nrNotaFiscal;
                  setError(novoError);
                }}
                error={error.nrNotaFiscal}
                helperText={error.nrNotaFiscal ? "campo obrigatório" : ""}
                sx={{
                  marginLeft: ".5rem",
                  marginRight: ".5rem",
                  width: "25rem",
                }}
              />
            </div>
            <div className={styles.row}>
              <TextField
                value={serieNotaFiscal || ""}
                type="text"
                margin="normal"
                required
                id="serieNotaFiscal"
                label="Série da Nota Fiscal"
                name="serieNotaFiscal"
                onChange={(event) => setSerieNotaFiscal(event.target.value)}
                sx={{
                  marginLeft: ".5rem",
                  marginRight: ".5rem",
                  width: "40rem",
                }}
              />

              <div
                className="select-input"
                style={{
                  marginLeft: ".5rem",
                  marginRight: ".5rem",
                  width: "40rem",
                }}
              >
                <FormControl fullWidth>
                  <InputLabel id="select-envio-ocoren-label">
                    Envio OCOREN
                  </InputLabel>
                  <Select
                    labelId="select-envio-ocoren-label"
                    id="envioOcoren"
                    name="envioOcoren"
                    value={envioOcoren}
                    label="Envio OCOREN"
                    onChange={(e) => setEnvioOcoren(e.target.value)}
                  >
                    <MenuItem value="nenhum">Não enviar</MenuItem>
                    <MenuItem value="matriz">Enviar para Matriz</MenuItem>
                    <MenuItem value="filial">Enviar para Filial</MenuItem>
                  </Select>
                </FormControl>
              </div>
            </div>
            <div
              className={styles.row}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "flex-start",
                padding: "1rem .5rem",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  width: "100%",
                  marginBottom: "15px",
                }}
              >
                <strong>Fotos da carga</strong>

                <Button type="button" variant="outlined" component="label">
                  + Adicionar fotos
                  <input
                    type="file"
                    accept="image/jpeg,image/jpg,image/png,image/webp"
                    multiple
                    hidden
                    onChange={handleSelecionarFotos}
                  />
                </Button>
              </div>

              {/* FOTOS JÁ SALVAS */}
              {fotosExistentes.length > 0 && (
                <>
                  <div
                    style={{
                      marginBottom: "8px",
                      fontSize: "14px",
                      fontWeight: "500",
                    }}
                  >
                    Fotos já cadastradas
                  </div>

                  <div
                    style={{
                      display: "flex",
                      flexWrap: "wrap",
                      gap: "12px",
                      width: "100%",
                    }}
                  >
                    {fotosExistentes.map((foto, index) => (
                      <div
                        key={`${foto.url}-${index}`}
                        style={{
                          position: "relative",
                          width: "180px",
                          height: "130px",
                        }}
                      >
                        <img
                          src={foto.url}
                          alt={`Foto da carga ${index + 1}`}
                          style={{
                            width: "100%",
                            height: "100%",
                            objectFit: "cover",
                            borderRadius: "8px",
                            border: "1px solid #ddd",
                          }}
                        />

                        <button
                          type="button"
                          onClick={() => handleExcluirFotoExistente(index)}
                          style={{
                            position: "absolute",
                            top: "5px",
                            right: "5px",
                            width: "28px",
                            height: "28px",
                            borderRadius: "50%",
                            border: "none",
                            background: "#d32f2f",
                            color: "#fff",
                            cursor: "pointer",
                            fontWeight: "bold",
                          }}
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                </>
              )}

              {/* NOVAS FOTOS */}
              {fotosPreview.length > 0 && (
                <>
                  <div
                    style={{
                      marginTop: "20px",
                      marginBottom: "8px",
                      fontSize: "14px",
                      fontWeight: "500",
                    }}
                  >
                    Novas fotos
                  </div>

                  <div
                    style={{
                      display: "flex",
                      flexWrap: "wrap",
                      gap: "12px",
                      width: "100%",
                    }}
                  >
                    {fotosPreview.map((foto, index) => (
                      <div
                        key={`${foto.url}-${index}`}
                        style={{
                          position: "relative",
                          width: "180px",
                          height: "130px",
                        }}
                      >
                        <img
                          src={foto.url}
                          alt={`Nova foto ${index + 1}`}
                          style={{
                            width: "100%",
                            height: "100%",
                            objectFit: "cover",
                            borderRadius: "8px",
                            border: "1px solid #ddd",
                          }}
                        />

                        <button
                          type="button"
                          onClick={() => handleRemoverFotoPreview(index)}
                          style={{
                            position: "absolute",
                            top: "5px",
                            right: "5px",
                            width: "28px",
                            height: "28px",
                            borderRadius: "50%",
                            border: "none",
                            background: "#d32f2f",
                            color: "#fff",
                            cursor: "pointer",
                            fontWeight: "bold",
                          }}
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
            <div className={styles.row}>
              <TextField
                value={observacao || ""}
                type="text"
                margin="normal"
                fullWidth
                id="observacao"
                label="Observações"
                name="observacao"
                onChange={(event) => setObservacao(event.target.value)}
                multiline
                rows={4}
                sx={{ marginLeft: ".5rem", marginRight: ".5rem" }}
              />
            </div>
            <div className={styles.row}>
              <TextField
                value={textoOcorrencia || ""}
                type="text"
                margin="normal"
                fullWidth
                required
                id="textoOcorrencia"
                label="Texto da Ocorrência (OCOREN)"
                name="textoOcorrencia"
                onChange={(event) => setTextoOcorrencia(event.target.value)}
                multiline
                rows={2}
                sx={{ marginLeft: ".5rem", marginRight: ".5rem" }}
              />
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
              >
                Salvar
              </Button>
            </div>
          </div>
        </Box>
      </div>
      <ModalDialogNovoCliente
        open={openClienteModal}
        handleClose={() => setOpenClienteModal(false)}
        handleGravar={handleGravarCliente}
      />
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
