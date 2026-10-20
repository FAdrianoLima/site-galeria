import * as React from "react";
import Dialog from "@mui/material/Dialog";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import DialogTitle from "@mui/material/DialogTitle";
import moment from "moment/moment";
import CustomizedStepper from "./stepper";
import IconButton from "@mui/material/IconButton";
import CloseIcon from "@mui/icons-material/Close";

export default function VisualizarCarga({
  open = false,
  carga = {},
  handleClose,
}) {
  const [dadosCarga, setDadosCarga] = React.useState({});
  const [activeStep, setActiveStep] = React.useState(0);

  React.useEffect(() => {
    if (open) {
      setDadosCarga(carga);

      switch (carga.situacao) {
        case "deposito":
          setActiveStep(0);
          break;

        case "em_rota":
          setActiveStep(1);
          break;

        case "entregue":
          setActiveStep(2);
          break;

        default:
          setActiveStep(0);
          break;
      }
    } else {
      setDadosCarga({});
      setActiveStep(0);
    }
  }, [open, carga]);

  const fotos = Array.isArray(dadosCarga.fotos) ? dadosCarga.fotos : [];

  const obterUrlFoto = (foto) => {
    if (typeof foto === "string") {
      return foto;
    }

    return foto?.url || "";
  };

  return (
    <div className="w-full">
      <Dialog fullWidth maxWidth={"md"} open={open} onClose={handleClose}>
        <DialogTitle sx={{ textAlign: "center" }}>
          DETALHES DA CARGA
        </DialogTitle>

        <IconButton
          aria-label="close"
          onClick={handleClose}
          sx={{
            position: "absolute",
            right: 8,
            top: 8,
            color: (theme) => theme.palette.grey[500],
          }}
        >
          <CloseIcon />
        </IconButton>

        <DialogContent dividers>
          <DialogContentText
            sx={{
              py: "1rem",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
            }}
          >
            <div className="w-full max-w-[40rem] flex flex-col">
              <span>
                <b>Data da Carga :</b>{" "}
                {dadosCarga.dataCadastro
                  ? moment(new Date(dadosCarga.dataCadastro)).format(
                      "DD/MM/YYYY HH:mm",
                    )
                  : ""}
              </span>

              <span>
                <b>Nome do Motorista :</b> {dadosCarga.motorista}
              </span>

              <span>
                <b>Nº Nota Fiscal :</b> {dadosCarga.nrNotaFiscal}
              </span>

              <span className="pt-[.5rem]">
                <b>Observações :</b>
              </span>

              <div
                className="pb-[1rem]"
                style={{ whiteSpace: "pre-line" }}
                dangerouslySetInnerHTML={{
                  __html: dadosCarga.observacao || "",
                }}
              />

              {/* FOTOS DA CARGA */}
              {fotos.length > 0 && (
                <div
                  style={{
                    width: "100%",
                    marginTop: "1rem",
                  }}
                >
                  <span>
                    <b>Fotos da carga :</b>
                  </span>

                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns:
                        "repeat(auto-fill, minmax(180px, 1fr))",
                      gap: "12px",
                      marginTop: "12px",
                    }}
                  >
                    {fotos.map((foto, index) => {
                      const url = obterUrlFoto(foto);

                      if (!url) {
                        return null;
                      }

                      return (
                        <a
                          key={`${url}-${index}`}
                          href={url}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            display: "block",
                            width: "100%",
                            height: "180px",
                            overflow: "hidden",
                            borderRadius: "8px",
                            border: "1px solid #ddd",
                            background: "#f5f5f5",
                          }}
                        >
                          <img
                            src={url}
                            alt={`Foto da carga ${index + 1}`}
                            style={{
                              width: "100%",
                              height: "100%",
                              objectFit: "cover",
                              display: "block",
                            }}
                          />
                        </a>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            <CustomizedStepper activeStep={activeStep} />
          </DialogContentText>
        </DialogContent>
      </Dialog>
    </div>
  );
}
