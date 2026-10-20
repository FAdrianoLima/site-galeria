export default class LocalStorageCache {
  constructor() {}

  setData(key = "", data = {}) {
    try {
      localStorage.removeItem(key);
      localStorage.setItem(key, JSON.stringify(data));
    } catch (e) {
      throw e;
    }
  }

  getData(key = "") {
    try {
      const retorno = JSON.parse(localStorage.getItem(key));

      return retorno;
    } catch (e) {
      return undefined;
    }
  }

  removeItem(key = "") {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      return e;
    }
  }
}
