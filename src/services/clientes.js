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
} from "firebase/firestore";
import axios from "axios";
import LocalStorageCache from "./localstorage.cache";

const clientesRef = collection(db, "clientes");

export const ReadAll = () =>
  new Promise(async (resolve, reject) => {
    try {
      const localStorageClient = new LocalStorageCache();
      let retorno = localStorageClient.getData("clientes") || [];

      if (retorno.length === 0) {
        const data = await getDocs(clientesRef);
        const { docs } = data;
        retorno = docs
          .map((doc) => ({ ...doc.data(), id: doc.id }))
          .sort((a, b) => a.nome > b.nome);

        localStorageClient.setData("clientes", retorno);
      }
      resolve(retorno);
    } catch (error) {
      reject(error);
    }
  });

export const Read = (id = null) =>
  new Promise(async (resolve, reject) => {
    try {
      const documento = doc(db, "clientes", id);
      const docSnap = await getDoc(documento);

      if (docSnap.exists()) {
        resolve(docSnap.data());
      } else {
        throw new Error("Cliente não encontrado");
      }
    } catch (error) {
      reject(error);
    }
  });

export const Create = (props) =>
  new Promise(async (resolve, reject) => {
    try {
      const documento = await addDoc(clientesRef, { ...props });

      await AtualizaCache({ id: documento.id, ...props });

      resolve({ id: documento.id, ...props });
    } catch (error) {
      reject(error);
    }
  });

export const Update = (id, props) =>
  new Promise(async (resolve, reject) => {
    try {
      const documento = doc(db, "clientes", id);

      await updateDoc(documento, props);

      await AtualizaCache(props, id);

      resolve(true);
    } catch (error) {
      reject(error);
    }
  });

export const Delete = (id = "") =>
  new Promise(async (resolve, reject) => {
    try {
      const documento = doc(db, "clientes", id);

      await deleteDoc(documento);

      await AtualizaCache(null, id, true);

      resolve(true);
    } catch (error) {
      reject(error);
    }
  });

export const VerificaSeClienteExiste = async (cpfCnpj = "") => {
  try {
    const q = query(clientesRef, where("cpfCnpj", "==", cpfCnpj));
    const data = await getDocs(q);

    if (data.empty) {
      return false;
    }

    return true;
  } catch (error) {
    throw error;
  }
};

export const GetAddressFromCep = ({ cep = "" }) =>
  new Promise((resolve, reject) => {
    axios
      .get(`https://viacep.com.br/ws/${cep}/json/`)
      .then((retorno) => resolve(retorno))
      .catch((e) => reject(e));
  });

const AtualizaCache = (cliente = {}, id = "", excluir = false) =>
  new Promise((resolve, reject) => {
    try {
      const localStorageClient = new LocalStorageCache();

      const listaDeClientes = localStorageClient.getData("clientes") || [];
      const index = listaDeClientes.findIndex((a) => a.id === id);

      if (excluir && index >= 0) {
        listaDeClientes.splice(index, 1);
      } else {
        if (index < 0) {
          listaDeClientes.push(cliente);
        } else {
          listaDeClientes[index] = cliente;
        }
      }
      localStorageClient.setData("clientes", listaDeClientes);

      resolve();
    } catch (e) {
      reject(e);
    }
  });
