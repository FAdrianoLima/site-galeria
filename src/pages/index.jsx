import * as React from "react";
import Head from "next/head";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Container,
  Tab,
  Tabs,
  TextField,
  Typography,
  Card,
  CardContent,
  Chip,
  Stack,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import CalendarMonthOutlinedIcon from "@mui/icons-material/CalendarMonthOutlined";
import HistoryOutlinedIcon from "@mui/icons-material/HistoryOutlined";
import Banner from "../components/banner";
import Whats from "../components/whats";
import RodapeAl from "../components/rodape-al";

function formatarData(data) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(data || "")) return data || "";

  const [ano, mes, dia] = data.split("-");
  return `${dia}/${mes}/${ano}`;
}

function statusVisual(status) {
  switch (status) {
    case "confirmado":
      return { texto: "Confirmado", cor: "success" };
    case "agendado":
      return { texto: "Agendado", cor: "info" };
    case "concluido":
      return { texto: "Realizado", cor: "success" };
    case "cancelado":
      return { texto: "Cancelado", cor: "default" };
    default:
      return { texto: status || "Em atendimento", cor: "default" };
  }
}

function CartaoProcedimento({ item }) {
  const status = statusVisual(item.status);

  return (
    <Card
      variant="outlined"
      sx={{
        borderRadius: 3,
        borderColor: "#f0dce6",
        backgroundColor: "#fff",
      }}
    >
      <CardContent>
        <Stack
          direction={{ xs: "column", sm: "row" }}
          justifyContent="space-between"
          alignItems={{ xs: "flex-start", sm: "center" }}
          spacing={1}
        >
          <Typography fontWeight={700} color="#61364e">
            {item.servicoNome}
          </Typography>
          <Chip label={status.texto} color={status.cor} size="small" />
        </Stack>

        <Stack
          direction="row"
          alignItems="center"
          spacing={1}
          mt={2}
          color="text.secondary"
        >
          <CalendarMonthOutlinedIcon fontSize="small" />
          <Typography variant="body2">
            {formatarData(item.data)}
            {item.horario ? ` às ${item.horario}` : ""}
          </Typography>
        </Stack>
      </CardContent>
    </Card>
  );
}

function AreaProcedimentos() {
  const [cpf, setCpf] = React.useState("");
  const [dados, setDados] = React.useState(null);
  const [aba, setAba] = React.useState(0);
  const [carregando, setCarregando] = React.useState(false);
  const [erro, setErro] = React.useState("");

  const consultar = async (event) => {
    event.preventDefault();
    setErro("");
    setDados(null);

    const numero = cpf.replace(/\D/g, "");

    if (numero.length !== 11) {
      setErro("Informe um CPF com 11 números.");
      return;
    }

    setCarregando(true);

    try {
      const resposta = await fetch(
        "/.netlify/functions/consultarProcedimentos",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ cpf: numero }),
        },
      );

      const resultado = await resposta.json();

      if (!resposta.ok) {
        throw new Error(resultado.erro || "Não foi possível consultar.");
      }

      setDados(resultado);
      setAba(0);
    } catch (error) {
      setErro(error.message || "Ocorreu um erro na consulta.");
    } finally {
      setCarregando(false);
    }
  };

  const lista = aba === 0 ? dados?.futuros || [] : dados?.historico || [];

  return (
    <Box
      id="meus-procedimentos"
      sx={{
        py: { xs: 7, md: 10 },
        background: "linear-gradient(180deg, #fff8fb 0%, #ffffff 100%)",
      }}
    >
      <Container maxWidth="md">
        <Box textAlign="center" mb={4}>
          <Typography
            variant="overline"
            sx={{ color: "#a76a88", letterSpacing: 2 }}
          >
            GALERIA DA BELEZA
          </Typography>

          <Typography
            component="h2"
            variant="h3"
            sx={{
              fontSize: { xs: "2rem", md: "2.7rem" },
              fontWeight: 700,
              color: "#61364e",
              mt: 1,
              mb: 2,
            }}
          >
            Seu espaço de beleza
          </Typography>

          <Typography color="text.secondary" maxWidth={580} mx="auto">
            Consulte seus próximos atendimentos e relembre os procedimentos
            realizados conosco.
          </Typography>
        </Box>

        <Card
          elevation={0}
          sx={{
            border: "1px solid #f0dce6",
            borderRadius: 4,
            overflow: "hidden",
          }}
        >
          <CardContent sx={{ p: { xs: 2, sm: 4 } }}>
            <Box component="form" onSubmit={consultar}>
              <Typography variant="h6" fontWeight={700} color="#61364e" mb={1}>
                Consultar meus procedimentos
              </Typography>

              <Typography variant="body2" color="text.secondary" mb={2}>
                Informe o CPF cadastrado na Galeria da Beleza.
              </Typography>

              <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                <TextField
                  fullWidth
                  label="CPF"
                  placeholder="000.000.000-00"
                  value={cpf}
                  onChange={(event) => setCpf(event.target.value)}
                  inputProps={{ inputMode: "numeric", maxLength: 14 }}
                />

                <Button
                  type="submit"
                  variant="contained"
                  disabled={carregando}
                  startIcon={
                    carregando ? (
                      <CircularProgress size={18} color="inherit" />
                    ) : (
                      <SearchIcon />
                    )
                  }
                  sx={{
                    minWidth: { sm: 190 },
                    borderRadius: 2,
                    backgroundColor: "#8d526e",
                    "&:hover": { backgroundColor: "#704058" },
                  }}
                >
                  {carregando ? "Consultando" : "Consultar"}
                </Button>
              </Stack>
            </Box>

            {erro && (
              <Alert severity="error" sx={{ mt: 3 }}>
                {erro}
              </Alert>
            )}

            {dados && (
              <Box mt={4}>
                <Typography variant="h6" color="#61364e" fontWeight={700}>
                  Olá{dados.cliente.nome ? `, ${dados.cliente.nome}` : ""}! 💗
                </Typography>

                <Tabs
                  value={aba}
                  onChange={(_, valor) => setAba(valor)}
                  variant="fullWidth"
                  sx={{
                    mt: 2,
                    mb: 3,
                    "& .MuiTabs-indicator": {
                      backgroundColor: "#8d526e",
                    },
                    "& .Mui-selected": { color: "#8d526e !important" },
                  }}
                >
                  <Tab
                    icon={<CalendarMonthOutlinedIcon />}
                    iconPosition="start"
                    label={`Próximos (${dados.futuros.length})`}
                  />
                  <Tab
                    icon={<HistoryOutlinedIcon />}
                    iconPosition="start"
                    label={`Histórico (${dados.historico.length})`}
                  />
                </Tabs>

                {lista.length ? (
                  <Stack spacing={2}>
                    {lista.map((item) => (
                      <CartaoProcedimento key={item.id} item={item} />
                    ))}
                  </Stack>
                ) : (
                  <Alert severity="info">
                    {aba === 0
                      ? "Você não possui próximos agendamentos."
                      : "Ainda não há procedimentos no seu histórico."}
                  </Alert>
                )}
              </Box>
            )}
          </CardContent>
        </Card>

        <Typography
          variant="body2"
          color="text.secondary"
          textAlign="center"
          mt={3}
        >
          Precisa de ajuda? Entre em contato com a nossa equipe.
        </Typography>
      </Container>
    </Box>
  );
}

export default function Home() {
  React.useEffect(() => {
    document.body.style.backgroundColor = "#01030e";

    return () => {
      document.body.style.backgroundColor = "";
    };
  }, []);

  return (
    <>
      <Head>
        <title>Galeria da Beleza | Meus procedimentos</title>
        <meta
          name="description"
          content="Consulte seus agendamentos e histórico de procedimentos na Galeria da Beleza."
        />
      </Head>

      <div id="banner" />
      {/*
      <Banner />*/}
      <AreaProcedimentos />
      <Whats />
      <RodapeAl />
    </>
  );
}
