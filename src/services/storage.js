import {
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject,
} from "firebase/storage";

import { storage } from "../../firebase-config";

export const UploadFotoCarga = async (arquivo, cargaId) => {
  if (!arquivo || !cargaId) {
    return null;
  }

  const tiposPermitidos = [
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/webp",
  ];

  if (!tiposPermitidos.includes(arquivo.type)) {
    throw new Error("Formato de imagem inválido. Use JPG, PNG ou WEBP.");
  }

  if (arquivo.size > 5 * 1024 * 1024) {
    throw new Error("A imagem deve ter no máximo 5 MB.");
  }

  const extensao = arquivo.name.split(".").pop().toLowerCase();

  // UUID evita que duas fotos recebam o mesmo nome
  const nomeArquivo = `foto_${crypto.randomUUID()}.${extensao}`;

  const caminho = `cargas/${cargaId}/${nomeArquivo}`;

  const storageRef = ref(storage, caminho);

  await uploadBytes(storageRef, arquivo);

  const fotoUrl = await getDownloadURL(storageRef);

  return {
    url: fotoUrl,
    nome: nomeArquivo,
  };
};

export const ExcluirFotoCarga = async (fotoUrl) => {
  if (!fotoUrl) {
    return;
  }

  try {
    const fotoRef = ref(storage, fotoUrl);

    await deleteObject(fotoRef);
  } catch (error) {
    console.warn("Erro ao excluir foto:", error);
  }
};
