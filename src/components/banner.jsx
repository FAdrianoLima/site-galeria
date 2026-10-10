import Link from "next/link";
import Image from "next/image";
import styles from "../styles/Banner.module.css";

function Banner() {
  return (
    <section className={styles.background}>
      <div className={styles.decoracaoCirculo} />
      <div className={styles.decoracaoLinha} />

      <div className={styles.interno}>
        <div className={styles.conteudo}>
          <div className={styles.logo}>
            <Image
              src="/static/images/logo-galeria-da-beleza.png"
              alt="Galeria da Beleza"
              width={280}
              height={120}
              priority
            />
          </div>

          <span className={styles.subtitulo}>SEU MOMENTO, SEU CUIDADO</span>

          <h1>
            Realce o que te faz <span>única.</span>
          </h1>

          <p>
            Beleza, autoestima e bem-estar em um só lugar. Um espaço pensado
            para você se cuidar e se sentir ainda mais bonita.
          </p>

          <div className={styles.acoes}>
            <Link href="#servicos" className={styles.botao}>
              Conheça nossos serviços
              <span aria-hidden="true">→</span>
            </Link>

            <span className={styles.detalhe}>
              <span className={styles.ponto} />
              Seu momento de se cuidar começa aqui
            </span>
          </div>
        </div>

        <div className={styles.visual}>
          <div className={styles.arco}>
            <div className={styles.circuloInterno}>
              <span className={styles.simbolo}>✳</span>
              <span className={styles.textoCircular}>
                BELEZA • CUIDADO • AUTOESTIMA
              </span>
              <span className={styles.numero}>01</span>
            </div>
          </div>

          <div className={styles.flor}>
            <span>✳</span>
          </div>

          <div className={styles.selo}>
            <span>Seu espaço</span>
            <strong>de beleza</strong>
            <span>e bem-estar</span>
          </div>
        </div>
      </div>

      <div className={styles.rodape}>
        <span>BELEZA</span>
        <span className={styles.rodapeLinha} />
        <span>BEM-ESTAR</span>
        <span className={styles.rodapeLinha} />
        <span>AUTOESTIMA</span>
      </div>
    </section>
  );
}

export default Banner;
