import * as React from "react";
import Admin from "../../../components/admin";
import Paper from "@mui/material/Paper";
import Backdrop from "@mui/material/Backdrop";
import CircularProgress from "@mui/material/CircularProgress";
import Box from "@mui/material/Box";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemAvatar from "@mui/material/ListItemAvatar";
import ListItemText from "@mui/material/ListItemText";
import Avatar from "@mui/material/Avatar";
import { useRouter } from "next/router";
import { ReadAllByCustomer } from "../../../services/cargas";
import moment from "moment";
import FlagIcon from "@mui/icons-material/Flag";
import LocalShippingIcon from "@mui/icons-material/LocalShipping";
import DoneAllIcon from "@mui/icons-material/DoneAll";
import VisualizarCarga from "../../../components/visualizarCarga";

const Content = () => {
  const [cargas, setCargas] = React.useState([]);
  const [loader, setLoader] = React.useState(false);
  const [openModal, setOpenModal] = React.useState(false);
  const [cargaSelecionada, setCargaSelecionada] = React.useState({});

  const router = useRouter();

  React.useEffect(() => {
    if (router.isReady) {
      async function carregaDadosCarga() {
        try {
          const { clienteId } = JSON.parse(localStorage.getItem("user"));

          const listaCargas = await ReadAllByCustomer(clienteId);

          setCargas(listaCargas);
        } catch (error) {
          console.log(error);
        }
      }

      carregaDadosCarga();
    }
  }, [router.isReady]);

  return (
    <Paper className="paper">
      <div className="root">
        <Backdrop
          sx={{ color: "#fff", zIndex: (theme) => theme.zIndex.drawer + 1 }}
          open={loader}
        >
          <CircularProgress color="inherit" />
        </Backdrop>
        <Box sx={{ flexGrow: 1 }}>
          <List dense={false}>
            {cargas
              .sort((a, b) => a.dataCadastro < b.dataCadastro)
              .map((carga, index) => (
                <ListItem
                  key={`carga_${index}`}
                  sx={{ cursor: "pointer" }}
                  onClick={() => {
                    setCargaSelecionada(carga);
                    setOpenModal(true);
                  }}
                >
                  <ListItemAvatar>
                    {(() => {
                      const retorno = [];

                      switch (carga.situacao) {
                        case "deposito":
                          retorno.push(
                            <Avatar sx={{ backgroundColor: "#3363AC" }}>
                              <FlagIcon />
                            </Avatar>
                          );
                          break;
                        case "em_transporte":
                          retorno.push(
                            <Avatar sx={{ backgroundColor: "#db9600" }}>
                              <LocalShippingIcon />
                            </Avatar>
                          );
                          break;
                        case "entregue":
                          retorno.push(
                            <Avatar sx={{ backgroundColor: "#008000" }}>
                              <DoneAllIcon />
                            </Avatar>
                          );
                          break;
                      }

                      return retorno;
                    })()}
                  </ListItemAvatar>
                  <ListItemText
                    primary={`${carga.descricao} - ${moment(
                      new Date(carga.dataCadastro)
                    ).format("DD/MM/YYYY HH:mm")}`}
                    secondary={`Motorista: ${carga.motorista}`}
                  />
                </ListItem>
              ))}
          </List>
        </Box>
      </div>
      <VisualizarCarga
        handleClose={() => setOpenModal(false)}
        open={openModal}
        carga={cargaSelecionada}
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

  React.useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user"));

    setPermissao(user.admin);
  }, []);

  return (
    <Admin showLoader={loader}>
      <Content toggleLoader={toggleLoader} />
    </Admin>
  );
}
