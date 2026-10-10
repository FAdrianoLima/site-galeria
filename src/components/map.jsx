import styles from "../styles/GoogleMap.module.css";

function GoogleMap() {
  return (
    <section
      className={styles.background}
      style={{
        WebkitFilter: "grayscale(100%)",
        filter: "grayscale(100%)",
      }}
    >
      <iframe
        id="gmap_canvas"
        src="https://www.google.com/maps/embed?pb=!1m14!1m8!1m3!1d55849.10322101514!2d-51.563012665801196!3d-28.970506977333375!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x951c3360312efd53%3A0xe497304fd8e8fca6!2sCJS%20TRANSPORTES!5e0!3m2!1spt-BR!2sbr!4v1695062877292!5m2!1spt-BR!2sbr"
        
        scrolling="no"
        allowFullScreen
        width="100%"
        className={styles.mapa}
      ></iframe>
    </section>
  );
}

export default GoogleMap;
