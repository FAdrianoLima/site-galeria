import * as React from "react";

import { styled, createTheme, ThemeProvider } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import MuiDrawer from "@mui/material/Drawer";
import Box from "@mui/material/Box";
import MuiAppBar from "@mui/material/AppBar";
import Toolbar from "@mui/material/Toolbar";
import List from "@mui/material/List";
import Typography from "@mui/material/Typography";
import Divider from "@mui/material/Divider";
import IconButton from "@mui/material/IconButton";
import Container from "@mui/material/Container";
import MenuIcon from "@mui/icons-material/Menu";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import LogoutIcon from "@mui/icons-material/Logout";
import ListItem from "@mui/material/ListItem";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import Tooltip from "@mui/material/Tooltip";
import LinearProgress from "@mui/material/LinearProgress";
import ReceiptLongIcon from "@mui/icons-material/ReceiptLong";

import Link from "next/link";
import { useRouter } from "next/router";

// Ícones
import DashboardIcon from "@mui/icons-material/Dashboard";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import PeopleAltIcon from "@mui/icons-material/PeopleAlt";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import WhatsAppIcon from "@mui/icons-material/WhatsApp";
import SettingsIcon from "@mui/icons-material/Settings";

const drawerWidth = 250;

const AppBar = styled(MuiAppBar, {
  shouldForwardProp: (prop) => prop !== "open",
})(({ theme, open }) => ({
  zIndex: theme.zIndex.drawer + 1,

  transition: theme.transitions.create(["width", "margin"], {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.leavingScreen,
  }),

  ...(open && {
    marginLeft: drawerWidth,
    width: `calc(100% - ${drawerWidth}px)`,

    transition: theme.transitions.create(["width", "margin"], {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.enteringScreen,
    }),
  }),
}));

const Drawer = styled(MuiDrawer, {
  shouldForwardProp: (prop) => prop !== "open",
})(({ theme, open }) => ({
  "& .MuiDrawer-paper": {
    position: "relative",
    whiteSpace: "nowrap",
    width: drawerWidth,

    transition: theme.transitions.create("width", {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.enteringScreen,
    }),

    boxSizing: "border-box",

    ...(!open && {
      overflowX: "hidden",

      transition: theme.transitions.create("width", {
        easing: theme.transitions.easing.sharp,
        duration: theme.transitions.duration.leavingScreen,
      }),

      width: theme.spacing(7),

      [theme.breakpoints.up("sm")]: {
        width: theme.spacing(9),
      },
    }),
  },
}));

const mdTheme = createTheme({
  palette: {
    primary: {
      main: "#8B5CF6",
      contrastText: "#fff",
    },

    secondary: {
      main: "#EC4899",
      contrastText: "#fff",
    },

    background: {
      default: "#F8F7FA",
    },

    text: {
      primary: "#333333",
      secondary: "#777777",
    },
  },

  typography: {
    fontFamily: ["Inter", "Roboto", "Arial", "sans-serif"].join(","),
  },
});

const menuItems = [
  {
    label: "Dashboard",
    path: "/admin/dashboard",
    icon: <DashboardIcon />,
  },
  {
    label: "Agenda",
    path: "/admin/agenda",
    icon: <CalendarMonthIcon />,
  },
  {
    label: "Clientes",
    path: "/admin/clientes",
    icon: <PeopleAltIcon />,
  },
  {
    label: "Serviços",
    path: "/admin/servicos",
    icon: <AutoAwesomeIcon />,
  },
  {
    label: "Notas fiscais",
    path: "/admin/notas-fiscais",
    icon: <ReceiptLongIcon />,
  },
  {
    label: "Mensagens",
    path: "/admin/mensagens",
    icon: <WhatsAppIcon />,
  },
  {
    label: "Configurações",
    path: "/admin/configuracoes",
    icon: <SettingsIcon />,
  },
];

const pageTitles = {
  "/admin/dashboard": "Dashboard",
  "/admin/agenda": "Agenda",
  "/admin/clientes": "Clientes",
  "/admin/servicos": "Serviços",
  "/admin/notas-fiscais": "Notas Fiscais",
  "/admin/mensagens": "Mensagens",
  "/admin/configuracoes": "Configurações",
};

const Admin = ({ children = [], showLoader = false }) => {
  const [open, setOpen] = React.useState(true);
  const [loader, setLoader] = React.useState(false);

  const router = useRouter();

  const toggleDrawer = () => {
    setOpen(!open);
  };

  React.useEffect(() => {
    // Proteção da área administrativa.
    // O login grava "isAuth" no localStorage.
    const isAuth = localStorage.getItem("isAuth");

    if (!isAuth) {
      router.push("/admin");
      return;
    }

    if (window.innerWidth < 1024) {
      setOpen(false);
    }
  }, [router]);

  React.useEffect(() => {
    setLoader(showLoader);
  }, [showLoader]);

  const handleLogout = () => {
    localStorage.removeItem("isAuth");
    localStorage.removeItem("user");

    window.location.href = "/admin";
  };

  const tituloPagina = pageTitles[router.pathname] || "Galeria da Beleza";

  return (
    <ThemeProvider theme={mdTheme}>
      <Box sx={{ display: "flex" }}>
        <CssBaseline />

        {/* =====================================================
            HEADER
        ====================================================== */}

        <AppBar position="absolute" open={open}>
          <Toolbar
            sx={{
              pr: "24px",
              minHeight: "64px",
            }}
          >
            <IconButton
              edge="start"
              aria-label="abrir menu"
              onClick={toggleDrawer}
              sx={{
                color: "white",
                marginRight: "24px",
                ...(open && {
                  display: "none",
                }),
              }}
            >
              <MenuIcon />
            </IconButton>

            <Typography
              component="h1"
              variant="h6"
              color="white"
              noWrap
              sx={{
                flexGrow: 1,
                fontWeight: 600,
              }}
            >
              {tituloPagina}
            </Typography>

            <Tooltip title="Sair" placement="left">
              <IconButton
                sx={{
                  color: "white",
                }}
                onClick={handleLogout}
              >
                <LogoutIcon />
              </IconButton>
            </Tooltip>
          </Toolbar>
        </AppBar>

        {/* =====================================================
            MENU LATERAL
        ====================================================== */}

        <Drawer variant="permanent" open={open}>
          <Toolbar
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              px: 1,
              minHeight: "64px",
            }}
          >
            <Box
              sx={{
                width: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <img
                src="/static/images/logo-galeria-da-beleza.png"
                alt="Galeria da Beleza"
                style={{
                  padding: "10px",
                  maxWidth: "190px",
                  maxHeight: "55px",
                  objectFit: "contain",
                }}
              />
            </Box>

            <IconButton onClick={toggleDrawer}>
              <ChevronLeftIcon />
            </IconButton>
          </Toolbar>

          <Divider />

          <List sx={{ px: 1, pt: 1 }}>
            {menuItems.map((item) => {
              const ativo =
                router.pathname === item.path ||
                router.pathname.startsWith(`${item.path}/`);

              return (
                <Link
                  href={item.path}
                  passHref
                  key={item.path}
                  style={{
                    textDecoration: "none",
                    color: "inherit",
                  }}
                >
                  <ListItem disablePadding sx={{ mb: 0.5 }}>
                    <ListItemButton
                      selected={ativo}
                      sx={{
                        minHeight: 48,
                        borderRadius: "10px",

                        "&.Mui-selected": {
                          backgroundColor: "rgba(139, 92, 246, 0.10)",
                          color: "primary.main",

                          "& .MuiListItemIcon-root": {
                            color: "primary.main",
                          },
                        },

                        "&:hover": {
                          backgroundColor: "rgba(139, 92, 246, 0.06)",
                        },
                      }}
                    >
                      <ListItemIcon
                        sx={{
                          minWidth: 42,
                          color: ativo ? "primary.main" : "#777",
                        }}
                      >
                        {item.icon}
                      </ListItemIcon>

                      <ListItemText
                        primary={item.label}
                        primaryTypographyProps={{
                          fontSize: "0.92rem",
                          fontWeight: ativo ? 600 : 400,
                        }}
                      />
                    </ListItemButton>
                  </ListItem>
                </Link>
              );
            })}
          </List>
        </Drawer>

        {/* =====================================================
            CONTEÚDO
        ====================================================== */}

        <Box
          component="main"
          sx={{
            backgroundColor: "#F8F7FA",
            flexGrow: 1,
            minHeight: "100vh",
            overflow: "auto",
          }}
        >
          <Toolbar />

          {loader && <LinearProgress />}

          <Container
            maxWidth="xl"
            sx={{
              mt: 3,
              mb: 4,
              px: {
                xs: 2,
                sm: 3,
                md: 4,
              },
            }}
          >
            {children}
          </Container>
        </Box>
      </Box>
    </ThemeProvider>
  );
};

export default Admin;
