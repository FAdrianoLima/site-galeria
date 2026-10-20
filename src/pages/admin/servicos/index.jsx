import * as React from "react";
import Admin from "../../../components/admin";
import { ReadAll, Create, Update, Delete } from "../../../services/servicos";

import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  Grid,
  IconButton,
  Menu,
  MenuItem,
  Paper,
  Snackbar,
  Switch,
  TextField,
  Typography,
} from "@mui/material";

import AddIcon from "@mui/icons-material/Add";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import RefreshIcon from "@mui/icons-material/Refresh";

const FORMULARIO_INICIAL = {
  nome: "",
  categoria: "",
  descricao: "",
  duracao: 60,
  valor: "",
  ativo: true,
};

const formatarMoeda = (valor) =>
  Number(valor || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });

export default function Servicos() {
  const [servicos, setServicos] = React.useState([]);
  const [carregando, setCarregando] = React.useState(true);
  const [salvando, setSalvando] = React.useState(false);
  const [erro, setErro] = React.useState("");
  const [aviso, setAviso] = React.useState("");

  const [modalAberto, setModalAberto] = React.useState(false);
  const [servicoEditando, setServicoEditando] = React.useState(null);
  const [formulario, setFormulario] = React.useState(FORMULARIO_INICIAL);

  const [menuAnchor, setMenuAnchor] = React.useState(null);
  const [servicoMenu, setServicoMenu] = React.useState(null);
  const [servicoExcluir, setServicoExcluir] = React.useState(null);

  const carregarServicos = React.useCallback(async () => {
    setCarregando(true);
    setErro("");

    try {
      const resultado = await ReadAll();
      setServicos(resultado);
    } catch (error) {
      console.error("Erro ao carregar serviços:", error);

      setErro(
        error?.code === "permission-denied"
          ? "Sem permissão para acessar os serviços. Confira as regras do Firestore e a autenticação."
          : "Não foi possível carregar os serviços.",
      );
    } finally {
      setCarregando(false);
    }
  }, []);

  React.useEffect(() => {
    carregarServicos();
  }, [carregarServicos]);

  const abrirNovo = () => {
    setServicoEditando(null);
    setFormulario(FORMULARIO_INICIAL);
    setErro("");
    setModalAberto(true);
  };

  const abrirEdicao = (servico) => {
    setServicoEditando(servico);
    setFormulario({
      nome: servico.nome || "",
      categoria: servico.categoria || "",
      descricao: servico.descricao || "",
      duracao: servico.duracao ?? 60,
      valor: servico.valor ?? "",
      ativo: servico.ativo !== false,
    });
    setErro("");
    setModalAberto(true);
    fecharMenu();
  };

  const fecharModal = () => {
    if (salvando) return;
    setModalAberto(false);
    setServicoEditando(null);
    setErro("");
  };

  const alterarCampo = (campo, valor) => {
    setFormulario((atual) => ({
      ...atual,
      [campo]: valor,
    }));
  };

  const salvarServico = async (event) => {
    event.preventDefault();
    setErro("");

    if (!formulario.nome.trim()) {
      setErro("Informe o nome do serviço.");
      return;
    }

    if (!Number(formulario.duracao) || Number(formulario.duracao) <= 0) {
      setErro("Informe uma duração válida em minutos.");
      return;
    }

    if (formulario.valor === "" || Number(formulario.valor) < 0) {
      setErro("Informe um valor válido.");
      return;
    }

    setSalvando(true);

    try {
      const dados = {
        ...formulario,
        duracao: Number(formulario.duracao),
        valor: Number(formulario.valor),
      };

      if (servicoEditando) {
        await Update(servicoEditando.id, dados);
        setAviso("Serviço atualizado com sucesso.");
      } else {
        await Create(dados);
        setAviso("Serviço cadastrado com sucesso.");
      }

      setModalAberto(false);
      setServicoEditando(null);
      setFormulario(FORMULARIO_INICIAL);

      await carregarServicos();
    } catch (error) {
      console.error("Erro ao salvar serviço:", error);
      setErro(error.message || "Não foi possível salvar o serviço.");
    } finally {
      setSalvando(false);
    }
  };

  const abrirMenu = (event, servico) => {
    setMenuAnchor(event.currentTarget);
    setServicoMenu(servico);
  };

  const fecharMenu = () => {
    setMenuAnchor(null);
    setServicoMenu(null);
  };

  const alternarAtivo = async () => {
    if (!servicoMenu) return;

    const servico = servicoMenu;
    fecharMenu();
    setErro("");

    try {
      await Update(servico.id, {
        nome: servico.nome,
        categoria: servico.categoria || "",
        descricao: servico.descricao || "",
        duracao: servico.duracao,
        valor: servico.valor,
        ativo: servico.ativo === false,
      });

      setAviso(
        servico.ativo === false ? "Serviço ativado." : "Serviço desativado.",
      );

      await carregarServicos();
    } catch (error) {
      console.error("Erro ao alterar status:", error);
      setErro(error.message || "Não foi possível alterar o status.");
    }
  };

  const excluirServico = async () => {
    if (!servicoExcluir) return;

    setErro("");

    try {
      await Delete(servicoExcluir.id);
      setAviso("Serviço excluído.");
      setServicoExcluir(null);
      await carregarServicos();
    } catch (error) {
      console.error("Erro ao excluir serviço:", error);
      setErro(error.message || "Não foi possível excluir o serviço.");
      setServicoExcluir(null);
    }
  };

  return (
    <Admin>
      <Box sx={{ width: "100%", pb: 4 }}>
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            mb: 3,
            gap: 2,
            flexWrap: "wrap",
          }}
        >
          <Box>
            <Typography variant="h4" fontWeight={700}>
              Serviços
            </Typography>

            <Typography color="text.secondary">
              Gerencie os procedimentos oferecidos pela Galeria da Beleza.
            </Typography>

            {!carregando && (
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ mt: 0.5 }}
              >
                {servicos.length} serviço(s) cadastrado(s)
              </Typography>
            )}
          </Box>

          <Box sx={{ display: "flex", gap: 1 }}>
            <Button
              variant="outlined"
              startIcon={<RefreshIcon />}
              onClick={carregarServicos}
              disabled={carregando}
            >
              Atualizar
            </Button>

            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={abrirNovo}
              sx={{ borderRadius: 2 }}
            >
              Novo serviço
            </Button>
          </Box>
        </Box>

        {erro && !modalAberto && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setErro("")}>
            {erro}
          </Alert>
        )}

        {carregando ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
            <CircularProgress />
          </Box>
        ) : servicos.length === 0 ? (
          <Paper
            elevation={0}
            sx={{
              p: { xs: 3, sm: 6 },
              borderRadius: 3,
              border: "1px solid #eee",
              textAlign: "center",
            }}
          >
            <Typography variant="h6" fontWeight={700}>
              Nenhum serviço cadastrado
            </Typography>

            <Typography color="text.secondary" sx={{ mt: 1, mb: 3 }}>
              Cadastre os procedimentos da Galeria da Beleza para utilizá-los
              nos agendamentos.
            </Typography>

            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={abrirNovo}
            >
              Cadastrar primeiro serviço
            </Button>
          </Paper>
        ) : (
          <Grid container spacing={2.5}>
            {servicos.map((servico) => (
              <Grid item xs={12} sm={6} md={4} lg={3} key={servico.id}>
                <Paper
                  elevation={0}
                  sx={{
                    p: 2.5,
                    borderRadius: 3,
                    border: "1px solid #eee",
                    height: "100%",
                    opacity: servico.ativo === false ? 0.7 : 1,
                  }}
                >
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "flex-start",
                      gap: 1,
                    }}
                  >
                    <Chip
                      size="small"
                      label={servico.categoria || "Sem categoria"}
                      color="secondary"
                      variant="outlined"
                    />

                    <IconButton
                      size="small"
                      aria-label={`Opções de ${servico.nome}`}
                      onClick={(event) => abrirMenu(event, servico)}
                    >
                      <MoreVertIcon fontSize="small" />
                    </IconButton>
                  </Box>

                  <Typography
                    variant="h6"
                    fontWeight={700}
                    sx={{ mt: 2, overflowWrap: "anywhere" }}
                  >
                    {servico.nome}
                  </Typography>

                  {servico.descricao && (
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ mt: 1, whiteSpace: "pre-line" }}
                    >
                      {servico.descricao}
                    </Typography>
                  )}

                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 0.7,
                      mt: 2,
                      color: "text.secondary",
                    }}
                  >
                    <AccessTimeIcon fontSize="small" />

                    <Typography variant="body2">
                      {servico.duracao
                        ? `${servico.duracao} min`
                        : "Duração não informada"}
                    </Typography>
                  </Box>

                  <Typography variant="h6" fontWeight={700} sx={{ mt: 2 }}>
                    {formatarMoeda(servico.valor)}
                  </Typography>

                  <Chip
                    size="small"
                    label={servico.ativo === false ? "Inativo" : "Ativo"}
                    color={servico.ativo === false ? "default" : "success"}
                    sx={{ mt: 2 }}
                  />
                </Paper>
              </Grid>
            ))}
          </Grid>
        )}

        <Menu
          anchorEl={menuAnchor}
          open={Boolean(menuAnchor)}
          onClose={fecharMenu}
        >
          <MenuItem onClick={() => servicoMenu && abrirEdicao(servicoMenu)}>
            <EditIcon fontSize="small" sx={{ mr: 1 }} />
            Editar
          </MenuItem>

          <MenuItem onClick={alternarAtivo}>
            {servicoMenu?.ativo === false
              ? "Ativar serviço"
              : "Desativar serviço"}
          </MenuItem>

          <MenuItem
            onClick={() => {
              setServicoExcluir(servicoMenu);
              fecharMenu();
            }}
            sx={{ color: "error.main" }}
          >
            <DeleteIcon fontSize="small" sx={{ mr: 1 }} />
            Excluir
          </MenuItem>
        </Menu>

        <Dialog
          open={modalAberto}
          onClose={fecharModal}
          fullWidth
          maxWidth="sm"
        >
          <Box component="form" onSubmit={salvarServico}>
            <DialogTitle>
              {servicoEditando ? "Editar serviço" : "Novo serviço"}
            </DialogTitle>

            <DialogContent dividers>
              {erro && (
                <Alert severity="error" sx={{ mb: 2 }}>
                  {erro}
                </Alert>
              )}

              <Grid container spacing={2} sx={{ pt: 0.5 }}>
                <Grid item xs={12}>
                  <TextField
                    label="Nome do serviço"
                    value={formulario.nome}
                    onChange={(event) =>
                      alterarCampo("nome", event.target.value)
                    }
                    required
                    fullWidth
                    autoFocus
                  />
                </Grid>

                <Grid item xs={12}>
                  <TextField
                    label="Categoria"
                    value={formulario.categoria}
                    onChange={(event) =>
                      alterarCampo("categoria", event.target.value)
                    }
                    fullWidth
                    placeholder="Ex.: Facial, Corporal, Sobrancelhas"
                  />
                </Grid>

                <Grid item xs={12}>
                  <TextField
                    label="Descrição"
                    value={formulario.descricao}
                    onChange={(event) =>
                      alterarCampo("descricao", event.target.value)
                    }
                    fullWidth
                    multiline
                    minRows={2}
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Duração (minutos)"
                    type="number"
                    value={formulario.duracao}
                    onChange={(event) =>
                      alterarCampo("duracao", event.target.value)
                    }
                    inputProps={{ min: 1, step: 1 }}
                    required
                    fullWidth
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Valor (R$)"
                    type="number"
                    value={formulario.valor}
                    onChange={(event) =>
                      alterarCampo("valor", event.target.value)
                    }
                    inputProps={{ min: 0, step: "0.01" }}
                    required
                    fullWidth
                  />
                </Grid>

                <Grid item xs={12}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={formulario.ativo}
                        onChange={(event) =>
                          alterarCampo("ativo", event.target.checked)
                        }
                      />
                    }
                    label="Serviço ativo e disponível para agendamento"
                  />
                </Grid>
              </Grid>
            </DialogContent>

            <DialogActions sx={{ p: 2 }}>
              <Button onClick={fecharModal} disabled={salvando}>
                Cancelar
              </Button>

              <Button type="submit" variant="contained" disabled={salvando}>
                {salvando ? (
                  <CircularProgress size={22} color="inherit" />
                ) : servicoEditando ? (
                  "Salvar alterações"
                ) : (
                  "Cadastrar serviço"
                )}
              </Button>
            </DialogActions>
          </Box>
        </Dialog>

        <Dialog
          open={Boolean(servicoExcluir)}
          onClose={() => setServicoExcluir(null)}
          maxWidth="xs"
          fullWidth
        >
          <DialogTitle>Excluir serviço?</DialogTitle>

          <DialogContent>
            <Typography>
              Deseja realmente excluir <strong>{servicoExcluir?.nome}</strong>?
              Essa ação não pode ser desfeita.
            </Typography>
          </DialogContent>

          <DialogActions sx={{ p: 2 }}>
            <Button onClick={() => setServicoExcluir(null)}>Cancelar</Button>

            <Button color="error" variant="contained" onClick={excluirServico}>
              Excluir
            </Button>
          </DialogActions>
        </Dialog>

        <Snackbar
          open={Boolean(aviso)}
          autoHideDuration={4000}
          onClose={() => setAviso("")}
          message={aviso}
        />
      </Box>
    </Admin>
  );
}
