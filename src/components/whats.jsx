import styles from "../styles/WhatsApp.module.css";
import Link from "next/link";

function Whats() {
  return (
    <div className={styles.background}>
      <Link
        href="https://api.whatsapp.com/send?phone=5554996350232&text=Ol%C3%A1%2C%20gostaria%20de%20tirar%20uma%20d%C3%BAvida."
        target="_blank"
        passHref
      >
        <img src="/whatsapp.png" alt="Whats App" />
      </Link>
    </div>
  );
}

export default Whats;
