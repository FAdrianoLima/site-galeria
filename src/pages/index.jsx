import * as React from "react";
import Banner from "../components/banner";
import Menu from "../components/menu";
import Rodape from "../components/rodape";
import Whats from "../components/whats";
import RodapeAl from "../components/rodape-al";

export default function Home() {
  React.useEffect(() => {
    window.document.body.style.backgroundColor = "#01030e";
  }, []);

  return (
    <>
      <div id="banner" />
      <Banner />
      <Whats />
      <RodapeAl />
    </>
  );
}
