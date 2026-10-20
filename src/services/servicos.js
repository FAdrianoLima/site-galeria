import { db } from "../../firebase-config";
import {
  collection,
  addDoc,
  getDocs,
  getDoc,
  doc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  query,
  orderBy,
} from "firebase/firestore";

const COLECAO = "servicos";

const normalizarServico = (dados) => ({
  nome: String(dados.nome || "").trim(),
  categoria: String(dados.categoria || "").trim(),
  descricao: String(dados.descricao || "").trim(),
  duracao: Number(dados.duracao) || 0,
  valor: Number(dados.valor) || 0,
  ativo: dados.ativo !== false,
});

export async function ReadAll() {
  const referencia = collection(db, COLECAO);

  try {
    const consulta = query(referencia, orderBy("nome", "asc"));
    const snapshot = await getDocs(consulta);

    return snapshot.docs.map((item) => ({
      id: item.id,
      ...item.data(),
    }));
  } catch (error) {
    // Se ainda não houver o campo nome em documentos antigos,
    // tenta consultar a coleção sem ordenação.
    if (error.code === "permission-denied") {
      throw error;
    }

    const snapshot = await getDocs(referencia);

    return snapshot.docs
      .map((item) => ({
        id: item.id,
        ...item.data(),
      }))
      .sort((a, b) =>
        String(a.nome || "").localeCompare(String(b.nome || ""), "pt-BR", {
          sensitivity: "base",
        }),
      );
  }
}

export async function Read(id) {
  if (!id) throw new Error("ID do serviço não informado.");

  const referencia = doc(db, COLECAO, id);
  const snapshot = await getDoc(referencia);

  if (!snapshot.exists()) {
    return null;
  }

  return {
    id: snapshot.id,
    ...snapshot.data(),
  };
}

export async function Create(dados) {
  const servico = normalizarServico(dados);

  if (!servico.nome) {
    throw new Error("Informe o nome do serviço.");
  }

  if (servico.duracao <= 0) {
    throw new Error("A duração deve ser maior que zero.");
  }

  if (servico.valor < 0) {
    throw new Error("O valor não pode ser negativo.");
  }

  const referencia = await addDoc(collection(db, COLECAO), {
    ...servico,
    criadoEm: serverTimestamp(),
    atualizadoEm: serverTimestamp(),
  });

  return {
    id: referencia.id,
    ...servico,
  };
}

export async function Update(id, dados) {
  if (!id) throw new Error("ID do serviço não informado.");

  const servico = normalizarServico(dados);

  if (!servico.nome) {
    throw new Error("Informe o nome do serviço.");
  }

  if (servico.duracao <= 0) {
    throw new Error("A duração deve ser maior que zero.");
  }

  if (servico.valor < 0) {
    throw new Error("O valor não pode ser negativo.");
  }

  await updateDoc(doc(db, COLECAO, id), {
    ...servico,
    atualizadoEm: serverTimestamp(),
  });

  return { id, ...servico };
}

export async function Delete(id) {
  if (!id) throw new Error("ID do serviço não informado.");

  await deleteDoc(doc(db, COLECAO, id));

  return true;
}
