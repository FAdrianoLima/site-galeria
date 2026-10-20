import * as React from "react";
import Box from "@mui/material/Box";
import styles from "../styles/Rodape.module.css";
import PhoneIcon from "@mui/icons-material/Phone";
import RoomIcon from "@mui/icons-material/Room";
import EmailIcon from "@mui/icons-material/Email";
import TextField, { TextFieldProps } from "@mui/material/TextField";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import Snackbar from "@mui/material/Snackbar";
import MuiAlert from "@mui/material/Alert";
import Link from "next/link";
import Button from "@mui/material/Button";

const Alert = React.forwardRef(function Alert(props, ref) {
  return <MuiAlert elevation={6} ref={ref} variant="filled" {...props} />;
});

const themeOptions = {
  palette: {
    type: "light",
    primary: {
      main: "#c4c4c4",
    },
    secondary: {
      main: "#c4c4c4",
    },
  },
};

const theme = createTheme(themeOptions);

function Rodape() {
  return (
    <footer id="rodape" className={styles.background}>
      <div className={styles.interno}>
        <div className={styles.box_row} style={{ justifyContent: "flex-end" }}>
          <div className={styles.box2}>
            <div className={` ${styles.box_row} ${styles.textolaranja}`}>
              Envie Conosco
            </div>

            <div className={` ${styles.box_row} ${styles.textobranco}`}>
              e tenha garantia de <br />
              entregas ágeis e seguras
            </div>
          </div>

          <div className={styles.box}>
            <span>
              <div
                className={` ${styles.box_row} ${styles.footericon} ${styles.texto}`}
              >
                <RoomIcon className={` ${styles.icon} `} />
                <p>
                  Veranópolis - RS, 95330-000 <br />
                  Travessa Franzis - Valverde
                </p>
              </div>
              <div className={` ${styles.box_row} ${styles.footericon}`}>
                <EmailIcon className={` ${styles.icon}`} />
                financeiro.cjstransportes@gmail.com
              </div>
              <div className={` ${styles.box_row} ${styles.footericon}`}>
                <PhoneIcon className={` ${styles.icon}`} />
                +55 54 9 9977-5827
              </div>
            </span>

            <div className={styles.box}>
              <ul className={styles.social_media}>
                <li>
                  <Link
                    href="https://www.facebook.com/profile.php?id=100078795070667"
                    target="_blank"
                    passHref
                  >
                    <img src="/facebook-branco.png" alt="" />
                  </Link>
                </li>
                <li>
                  <Link
                    href="https://www.instagram.com/cjs_transportes/"
                    target="_blank"
                    passHref
                  >
                    <img src="/Instagram-branco.png" alt="" />
                  </Link>
                </li>
                <li>
                  <Link
                    href="https://www.linkedin.com/company/"
                    target="_blank"
                    passHref
                  >
                    <img src="/LinkedIn-branco.png" alt="" />
                  </Link>
                </li>
                <li>
                  <Link
                    href="https://api.whatsapp.com/send?phone=5554999775827"
                    target="_blank"
                    passHref
                  >
                    <img src="/whatsapp-branco.png" alt="" />
                  </Link>
                </li>
              </ul>
              <img
                src="/static/images/logo-galeria-da-beleza.png"
                alt="Logo Branca"
                className={styles.logo}
              />
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Rodape;
