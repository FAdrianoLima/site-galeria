
const VITE_ENV = (import.meta.env || {});

console.log("VITE_USE_FIRESTORE_MOCK =", VITE_ENV.VITE_USE_FIRESTORE_MOCK);


const useMock = VITE_ENV.VITE_USE_FIRESTORE_MOCK === "true";

let collectionFn,
  docFn,
  getDocsFn,
  getDocFn,
  addDocFn,
  updateDocFn,
  deleteDocFn,
  queryFn,
  whereFn,
  db;

if (useMock) {
  console.warn("🔥 Firestore MOCK ativado");
  const mock = await import("./firestore.mock.js");

  // mock não usa db, mas precisamos manter compatibilidade
  db = {};

  collectionFn = mock.mockCollection;
  docFn = mock.mockDoc;
  getDocsFn = mock.mockGetDocs;
  getDocFn = mock.mockGetDoc;
  addDocFn = mock.mockAddDoc;
  updateDocFn = mock.mockUpdateDoc;
  deleteDocFn = mock.mockDeleteDoc;
  queryFn = mock.mockQuery;
  whereFn = mock.mockWhere;

} else {
  console.warn("🔥 Firestore REAL ativado");
  const firebase = await import("firebase/firestore");
  const firebaseConfig = await import("../../firebase-config");

  db = firebaseConfig.db;

  collectionFn = firebase.collection;
  docFn = firebase.doc;
  getDocsFn = firebase.getDocs;
  getDocFn = firebase.getDoc;
  addDocFn = firebase.addDoc;
  updateDocFn = firebase.updateDoc;
  deleteDocFn = firebase.deleteDoc;
  queryFn = firebase.query;
  whereFn = firebase.where;
}

import LocalStorageCache from "./localstorage.cache";


/* ======================================================
   REFERÊNCIA DA COLEÇÃO
====================================================== */

const cargasRef = collectionFn(db, "cargas");


/* ======================================================
   FUNÇÕES CRUD
====================================================== */

export const ReadAll = () =>
  new Promise(async (resolve, reject) => {
    
    try {
      const local = new LocalStorageCache();
      let retorno = local.getData("cargas") || [];

      if (retorno.length === 0) {
        const data = await getDocsFn(cargasRef);
        retorno = data.docs.map((d) => ({ id: d.id, ...d.data() }));
        local.setData("cargas", retorno);
      }

      resolve(retorno);
    } catch (error) {
      reject(error);
    }
  });



export const Read = (id) =>
  new Promise(async (resolve, reject) => {
    try {
      const documento = docFn(db, "cargas", id);
      const snap = await getDocFn(documento);

      if (!snap.exists()) throw new Error("Carga não encontrada");

      resolve(snap.data());
    } catch (error) {
      reject(error);
    }
  });



export const Create = (props) =>
  new Promise(async (resolve, reject) => {
    try {
      const { nrNotaFiscal, cliente } = props;

      const cpfCnpj = cliente.cpfCnpj.replace(/[.\-\/]/g, "");
      const hashes = CriarHashes(cpfCnpj, nrNotaFiscal);

      const parametros = {
        cliente: props.cliente,
        nrNotaFiscal: props.nrNotaFiscal,
        status: props.status ?? "pendente",
        dataCadastro: new Date().toISOString(),
        arquivo: {
          nome: props.arquivo?.nome ?? null,
          enviado: props.arquivo?.enviado ?? false,
        },
        hashes,
      };

      const documento = await addDocFn(cargasRef, parametros);

      await AtualizaCache({ id: documento.id, ...parametros });

      resolve(documento.id);
    } catch (error) {
      reject(error);
    }
  });



export const Update = (id, props) =>
  new Promise(async (resolve, reject) => {
    try {
      const { nrNotaFiscal, cliente } = props;

      const cpfCnpj = cliente.cpfCnpj.replace(/[.\-\/]/g, "");
      const hashes = CriarHashes(cpfCnpj, nrNotaFiscal);

      const parametros = {
        ...props,
        hashes,
      };

      const documento = docFn(db, "cargas", id);

      await updateDocFn(documento, parametros);
      await AtualizaCache(parametros, id);

      resolve(true);
    } catch (error) {
      reject(error);
    }
  });



export const Delete = (id) =>
  new Promise(async (resolve, reject) => {
    try {
      const documento = docFn(db, "cargas", id);

      await deleteDocFn(documento);
      await AtualizaCache(null, id, true);

      resolve(true);
    } catch (error) {
      reject(error);
    }
  });



export const ReadAllByCustomer = (id) =>
  new Promise(async (resolve, reject) => {
    try {
      const q = queryFn(cargasRef, whereFn("cliente.id", "==", id));
      const data = await getDocsFn(q);
      const retorno = data.docs.map((d) => ({ id: d.id, ...d.data() }));
      resolve(retorno);
    } catch (error) {
      reject(error);
    }
  });



export const ReadByHash = (hash) =>
  new Promise(async (resolve, reject) => {
    try {
      const q = queryFn(cargasRef, whereFn("hashes", "array-contains", hash));
      const data = await getDocsFn(q);

      if (data.empty) throw new Error("Carga não encontrada");

      const doc = data.docs[0];
      resolve({ id: doc.id, ...doc.data() });
    } catch (error) {
      reject(error);
    }
  });



/* ======================================================
   AUXILIARES
====================================================== */

const CriarHashes = (cnpj, notasFiscais = "") => {
  return notasFiscais.split(",").map((nf) =>
    Buffer.from(`${cnpj}:${nf.trim()}`).toString("base64")
  );
};


const AtualizaCache = (carga, id, excluir = false) =>
  new Promise((resolve, reject) => {
    try {
      const local = new LocalStorageCache();
      const lista = local.getData("cargas") || [];
      const index = lista.findIndex((a) => a.id === id);

      if (excluir) {
        if (index >= 0) lista.splice(index, 1);
      } else {
        if (index < 0) lista.push({ id, ...carga });
        else lista[index] = { id, ...carga };
      }

      local.setData("cargas", lista);
      resolve();
    } catch (e) {
      reject(e);
    }
  });
