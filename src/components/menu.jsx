import * as React from "react";
import styles from "../styles/Menu.module.css";
import Link from "next/link";

function Menu() {
  React.useEffect(() => {
    const btnMobile = document.getElementById(`${styles.btn_mobile}`);
    btnMobile.addEventListener("click", toggleMenu);
  }, []);

  React.useEffect(() => {
    const btnMobile = document.getElementById(`${styles.btn_mobile}`);
    btnMobile.addEventListener("click", toggleMenu);

    window.addEventListener("scroll", () => {
      const winScroll =
        document.body.scrollTop || document.documentElement.scrollTop;

      const menu = document.getElementById(styles.menuheader);

      if (winScroll > 0) {
        menu.classList.add(styles["menu-alternative"]);
      } else {
        menu.classList.remove(styles["menu-alternative"]);
      }
    });
  }, []);

  const [showSubMenu, setShowSubMenu] = React.useState(false);

  function handleMouseEnter() {
    setShowSubMenu(true);
  }

  function handleMouseLeave() {
    setShowSubMenu(false);
  }

  function toggleMenu() {
    const nav = document.getElementById(`${styles.nav}`);
    nav.classList.toggle(styles.active);
  }

  return (
    <div id={styles.menuheader} className={styles.header}>
      <div className={`${styles.interno}`}>
        <img
          src="/static/images/logo-galeria-da-beleza.png"
          alt="Logo branca"
          className={styles.logo}
        />

        <button id={`${styles.btn_mobile}`}>
          <span id={`${styles.hamburguer}`}></span>
        </button>

        <ul
          id={`${styles.nav}`}
          className={`${styles.menu} ${styles.navbar} ${styles.a2} `}
        >
          <li className={styles.li}>
            <Link href="/" passHref>
              Home
            </Link>
          </li>
          <li className={styles.li}>
            <Link href="/a-cjs" passHref>
              A CJS
            </Link>
          </li>

          <li className={styles.li}>
            <Link href="/servicos" passHref>
              Serviços
            </Link>
          </li>

          <li className={styles.li}>
            <Link href="/blog" passHref>
              Blog
            </Link>
          </li>
          <li className={styles.li}>
            <Link href="/trabalhe" passHref>
              Trabalhe Conosco
            </Link>
          </li>
          <li className={styles.li}>
            <Link href="/contato" passHref>
              Contato
            </Link>
          </li>
          <li>
            <Link
              href="/admin/pesquisa-de-carga"
              className={styles.button}
              target="_blank"
              passHref
            >
              Acompanhar Entrega
            </Link>
          </li>
        </ul>

        <ul className={`${styles.social_media}`}>
          <li>
            <Link
              href="https://www.facebook.com/profile.php?id=100078795070667"
              target="_blank"
              passHref
            >
              <img src="/facebook.png" alt="" />
            </Link>
          </li>
          <li>
            <Link
              href="https://www.instagram.com/cjs_transportes/"
              target="_blank"
              passHref
            >
              <img src="/Instagram.png" alt="" />
            </Link>
          </li>
          <li>
            <Link href="https://www.linkedin.com/" target="_blank" passHref>
              <img src="/LinkedIn.png" alt="" />
            </Link>
          </li>
        </ul>
      </div>
    </div>
  );
}

export default Menu;
