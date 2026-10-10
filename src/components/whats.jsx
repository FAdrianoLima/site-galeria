import styles from "../styles/WhatsApp.module.css";
import Link from "next/link";

function Whats() {
  return (
    <div className={styles.background}>
      <Link
        href="https://api.whatsapp.com/send?phone="
        target="_blank"
        passHref
      >
        <img src="/whatsapp.png" alt="Whats App" />
      </Link>
    </div>
  );
}

export default Whats;
