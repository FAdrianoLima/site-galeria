import Link from "next/link";
import styles from "../styles/RodapeAgencialAL.module.css";

export default function RodapeAgencialAL() {
  return (
    <div className={styles.root}>
      <div className={styles.content}>
        <span style={{ display: "flex", flexDirection: "row" }}>
          Direitos Reservados 2022 |&nbsp;
          <Link href="/docs/politica privacidade.pdf" target="_blank" passHref>
            Políticas de Privacidade
          </Link>
          &nbsp;| &nbsp;
          <Link href="/docs/termo uso.pdf" target="_blank" passHref>
            Termos de Uso
          </Link>
          &nbsp; |&nbsp;
          <Link href="/docs/politica-de-cookies.pdf" target="_blank" passHref>
            Política de Cookies
          </Link>
          &nbsp;|&nbsp;Desenvolvido por
        </span>
        <Link href="https://agenciaal.com.br/" target="_blank" passHref>
          <img src="/agenciaal.png" alt="NewFly" />
        </Link>
      </div>
    </div>
  );
}
