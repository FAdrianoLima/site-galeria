import * as React from "react";
import { Box, Stack, Typography } from "@mui/material";

const formatarMoeda = (valor) =>
  Number(valor || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });

const ponto = (cx, cy, raio, angulo) => [
  cx + raio * Math.cos(angulo),
  cy + raio * Math.sin(angulo),
];

// dados: [{ id, label, valor, cor }]
export default function GraficoPizza({
  dados = [],
  formatarValor = formatarMoeda,
  tamanho = 200,
}) {
  const itens = dados.filter((d) => Number(d.valor) > 0);
  const total = itens.reduce((t, d) => t + Number(d.valor), 0);

  if (total <= 0) {
    return (
      <Typography color="text.secondary" variant="body2">
        Sem valores no período selecionado.
      </Typography>
    );
  }

  const raio = tamanho / 2 - 4;
  const centro = tamanho / 2;
  let inicio = -Math.PI / 2;

  const fatias = itens.map((item) => {
    const fracao = Number(item.valor) / total;
    const fim = inicio + fracao * 2 * Math.PI;

    const [x1, y1] = ponto(centro, centro, raio, inicio);
    const [x2, y2] = ponto(centro, centro, raio, fim);

    const caminho = `M ${centro} ${centro} L ${x1} ${y1} A ${raio} ${raio} 0 ${
      fracao > 0.5 ? 1 : 0
    } 1 ${x2} ${y2} Z`;

    inicio = fim;

    return { ...item, fracao, caminho };
  });

  return (
    <Stack
      direction={{ xs: "column", sm: "row" }}
      spacing={3}
      alignItems="center"
      justifyContent="center"
    >
      <Box sx={{ flexShrink: 0 }}>
        <svg
          width={tamanho}
          height={tamanho}
          viewBox={`0 0 ${tamanho} ${tamanho}`}
          role="img"
          aria-label="Gráfico de pizza do faturamento por tipo"
        >
          {fatias.length === 1 ? (
            <circle cx={centro} cy={centro} r={raio} fill={fatias[0].cor} />
          ) : (
            fatias.map((fatia) => (
              <path
                key={fatia.id}
                d={fatia.caminho}
                fill={fatia.cor}
                stroke="#fff"
                strokeWidth="2"
              />
            ))
          )}
        </svg>
      </Box>

      <Stack spacing={1.5}>
        {fatias.map((fatia) => (
          <Stack
            key={fatia.id}
            direction="row"
            spacing={1.5}
            alignItems="center"
          >
            <Box
              sx={{
                width: 14,
                height: 14,
                borderRadius: "4px",
                bgcolor: fatia.cor,
                flexShrink: 0,
                printColorAdjust: "exact",
                WebkitPrintColorAdjust: "exact",
              }}
            />
            <Box>
              <Typography variant="body2" fontWeight={600}>
                {fatia.label} ·{" "}
                {(fatia.fracao * 100).toFixed(1).replace(".", ",")}%
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {formatarValor(fatia.valor)}
              </Typography>
            </Box>
          </Stack>
        ))}
      </Stack>
    </Stack>
  );
}
