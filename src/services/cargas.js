import { db } from "../../firebase-config";
import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
} from "firebase/firestore";
import LocalStorageCache from "./localstorage.cache";
import moment from "moment";

const cargasRef = collection(db, "cargas");

export const ReadAll = () =>
  new Promise(async (resolve, reject) => {
    try {
      const localStorageClient = new LocalStorageCache();

      let retorno = localStorageClient.getData("cargas") || [];

      if (retorno.length === 0) {
        const data = await getDocs(cargasRef);
        const { docs } = data;

        retorno = docs.map((doc) => ({ ...doc.data(), id: doc.id }));

        localStorageClient.setData("cargas", retorno);
      }
      resolve(retorno);
    } catch (error) {
      reject(error);
    }
  });

export const ReadAll12Months = () =>
  new Promise(async (response, reject) => {
    try {
      const localStorageClient = new LocalStorageCache();

      let retorno = localStorageClient.getData("cargas") || [];

      if (retorno.length === 0) {
        const hoje = new Date();
        const limite = new Date();

        limite.setMonth(hoje.getMonth() - 6);

        const hojeFormatado = moment(hoje).format("YYYY-MM-DD");
        const limiteFormatado = moment(limite).format("YYYY-MM-DD");

        const cargasRef = collection(db, "cargas");

        const q = query(
          cargasRef,
          where("dataCadastro", ">=", limiteFormatado),
          orderBy("dataCadastro", "desc"),
        );

        const snapshot = await getDocs(q);

        retorno = snapshot.docs.map((documento) => ({
          id: documento.id,
          ...documento.data(),
        }));

        localStorageClient.setData("cargas", retorno);
      }

      response(retorno);
    } catch (e) {
      console.error(e);
      reject(e);
    }
  });

export const Read = (id = null) =>
  new Promise(async (resolve, reject) => {
    try {
      const documento = doc(db, "cargas", id);
      const docSnap = await getDoc(documento);

      if (docSnap.exists()) {
        resolve({
          ...docSnap.data(),
          id: docSnap.id,
        });
      } else {
        throw new Error("Carga não encontrada");
      }
    } catch (error) {
      reject(error);
    }
  });

export const Create = (props) =>
  new Promise(async (resolve, reject) => {
    try {
      const { nrNotaFiscal, cliente } = props;

      const cpfCnpj = cliente.cpfCnpj
        .split(".")
        .join("")
        .split("-")
        .join("")
        .split("/")
        .join("");

      //const hash = Buffer.from(`${cpfCnpj}:${nrNotaFiscal}`).toString("base64");
      const hashes = CriarHashes(cpfCnpj, nrNotaFiscal);

      const parametros = {
        ...props,
        hashes,
      };

      const documento = await addDoc(cargasRef, parametros);

      await AtualizaCache({ id: documento.id, ...parametros });

      resolve(documento.id);
    } catch (error) {
      console.log(error);
      reject(error);
    }
  });

export const Update = (id, props) =>
  new Promise(async (resolve, reject) => {
    try {
      const { nrNotaFiscal, cliente } = props;

      const cpfCnpj = cliente.cpfCnpj
        .split(".")
        .join("")
        .split("-")
        .join("")
        .split("/")
        .join("");

      const hashes = CriarHashes(cpfCnpj, nrNotaFiscal);

      const parametros = {
        ...props,
        hashes,
      };

      const documento = doc(db, "cargas", id);

      await updateDoc(documento, parametros);

      await AtualizaCache(
        {
          ...parametros,
          id,
        },
        id,
      );

      resolve(true);
    } catch (error) {
      reject(error);
    }
  });

export const Delete = (id = "") =>
  new Promise(async (resolve, reject) => {
    try {
      const documento = doc(db, "cargas", id);

      await deleteDoc(documento);

      await AtualizaCache(null, id, true);

      resolve(true);
    } catch (error) {
      reject(error);
    }
  });

export const Patch = (id = "", novosDados = {}) =>
  new Promise(async (resolve, reject) => {
    try {
      const documento = doc(db, "cargas", id);
      const snapshot = await getDoc(documento);

      if (!snapshot.exists()) {
        throw new Error("Carga não encontrada");
      }

      const dadosAtualizados = {
        ...snapshot.data(),
        ...novosDados,
      };

      await updateDoc(documento, dadosAtualizados);

      await AtualizaCache(
        {
          ...dadosAtualizados,
          id,
        },
        id,
      );

      resolve(true);
    } catch (error) {
      reject(error);
    }
  });

export const ReadAllByCustomer = (id = "") =>
  new Promise(async (resolve, reject) => {
    try {
      const q = query(cargasRef, where("cliente.id", "==", id));
      const data = await getDocs(q);
      const { docs } = data;
      const retorno = docs.map((doc) => ({ ...doc.data(), id: doc.id }));

      resolve(retorno);
    } catch (error) {
      reject(error);
    }
  });

export const ReadByHash = (hash = "") =>
  new Promise(async (resolve, reject) => {
    try {
      const q = query(cargasRef, where("hashes", "array-contains", hash));
      const data = await getDocs(q);

      if (data.empty) {
        throw new Error("Carga não encontrada");
      }

      const { docs } = data;
      const retorno = docs.map((doc) => ({ ...doc.data(), id: doc.id }))[0];

      resolve(retorno);
    } catch (error) {
      reject(error);
    }
  });

const CriarHashes = (cnpj, notasFiscais = "") => {
  try {
    const retorno = [];

    notasFiscais.split(",").forEach((nf) => {
      const hash = Buffer.from(`${cnpj}:${nf.trim()}`).toString("base64");

      retorno.push(hash);
    });

    return retorno;
  } catch (error) {
    throw error;
  }
};

const AtualizaCache = (carga = {}, id = "", excluir = false) =>
  new Promise((resolve, reject) => {
    try {
      const localStorageClient = new LocalStorageCache();

      const listaDeCargas = localStorageClient.getData("cargas") || [];

      const indexCarga = listaDeCargas.findIndex((a) => a.id === id);

      if (excluir && indexCarga >= 0) {
        listaDeCargas.splice(indexCarga, 1);
      } else {
        const cargaComId = {
          ...carga,
          id,
        };

        if (indexCarga < 0) {
          listaDeCargas.push(cargaComId);
        } else {
          listaDeCargas[indexCarga] = cargaComId;
        }
      }

      localStorageClient.setData("cargas", listaDeCargas);

      resolve();
    } catch (e) {
      reject(e);
    }
  });
