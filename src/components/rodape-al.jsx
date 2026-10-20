import Link from "next/link";
import styles from "../styles/RodapeAgencialAL.module.css";

export default function RodapeAgencialAL() {
  const ano = new Date().getFullYear();

  return (
    <footer className={styles.root}>
      <div className={styles.content}>
        <div className={styles.info}>
          <span>© {ano} Agência AL. Todos os direitos reservados.</span>

          <nav className={styles.links} aria-label="Links legais">
            <Link
              href="/docs/politica%20privacidade.pdf"
              target="_blank"
              rel="noopener noreferrer"
            >
              Política de Privacidade
            </Link>

            <Link
              href="/docs/termo%20uso.pdf"
              target="_blank"
              rel="noopener noreferrer"
            >
              Termos de Uso
            </Link>

            <Link
              href="/docs/politica-de-cookies.pdf"
              target="_blank"
              rel="noopener noreferrer"
            >
              Política de Cookies
            </Link>
          </nav>

          <span className={styles.credito}>Desenvolvido por</span>
        </div>

        <Link
          href="https://agenciaal.com.br/"
          target="_blank"
          rel="noopener noreferrer"
          className={styles.logoLink}
          aria-label="Visite o site da Agência AL"
        >
          <img src="/agenciaal.png" alt="Agência AL" />
        </Link>
      </div>
    </footer>
  );
}
