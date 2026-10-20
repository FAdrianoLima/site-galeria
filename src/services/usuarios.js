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
import { getAuth, createUserWithEmailAndPassword } from "firebase/auth";

const usuariosRef = collection(db, "usuarios");

export const ReadAll = () =>
  new Promise(async (resolve) => {
    try {
      const data = await getDocs(usuariosRef);
      const { docs } = data;
      const retorno = docs.map((doc) => ({ ...doc.data(), id: doc.id }));

      resolve({ status: 200, data: retorno });
    } catch (error) {
      resolve({ status: 400, data: [] });
    }
  });

export const Read = ({ id = null }) =>
  new Promise(async (resolve) => {
    const segmentoDoc = doc(db, "usuarios", id);
    const docSnap = await getDoc(segmentoDoc);

    if (docSnap.exists()) {
      resolve({
        status: 200,
        data: { ...docSnap.data(), senha: makeRandomString(8) },
      });
    } else {
      resolve({ status: 400, data: {} });
    }
  });

export const ReadByEmail = ({ email = "" }) =>
  new Promise(async (resolve, reject) => {
    try {
      const q = query(usuariosRef, where("email", "==", email.toLowerCase()));
      const data = await getDocs(q);
      const { docs } = data;
      const usuarios = docs.map((doc) => ({ ...doc.data(), id: doc.id }));

      if (usuarios.length > 0) {
        resolve({ status: 200, data: usuarios[0] });
      } else {
        throw new Error("Usuário não encontrado");
      }
    } catch (error) {
      reject(error);
    }
  });

export const Create = ({
  nome = "",
  email = "",
  senha = "",
  ativo = false,
  tipoDeUsuario = "",
  clienteId = null,
}) =>
  new Promise((resolve) => {
    try {
      const auth = getAuth();

      createUserWithEmailAndPassword(auth, email, senha)
        .then(async (userCredential) => {
          const usuario = {
            fbId: userCredential.user.uid,
            email,
            nome,
            ativo,
            tipoDeUsuario,
            clienteId,
          };
          const newDoc = await addDoc(usuariosRef, { ...usuario });

          resolve({ status: 200, data: { id: newDoc.id, ...usuario } });
        })
        .catch(() => resolve({ status: 400, data: null }));
    } catch (error) {
      resolve({ status: 400, data: null });
    }
  });

export const Update = ({
  id = "",
  fbId = "",
  nome = "",
  ativo = false,
  tipoDeUsuario = "",
  clienteId = null,
}) =>
  new Promise(async (resolve) => {
    try {
      const segmentoDoc = doc(db, "usuarios", id);
      const newFields = {
        fbId,
        nome,
        ativo,
        tipoDeUsuario,
        clienteId,
      };

      await updateDoc(segmentoDoc, newFields);

      resolve({ status: 200, data: newFields });
    } catch (error) {
      resolve({ status: 400, data: null });
    }
  });

export const Delete = ({ id = "", fbId = "" }) =>
  new Promise(async (resolve) => {
    const auth = getAuth();

    const segmentoDoc = doc(db, "usuarios", id);

    await deleteDoc(segmentoDoc);

    resolve({ status: 200, data: {} });
  });

export const GetAddressFromCep = ({ cep = "" }) =>
  new Promise((resolve) => {
    axios
      .get(`https://viacep.com.br/ws/${cep}/json/`)
      .then((retorno) => resolve(retorno))
      .catch(() => resolve({ status: 400, data: {} }));
  });

const makeRandomString = (length) => {
  var result = "";
  var characters =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  var charactersLength = characters.length;
  for (var i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
};
