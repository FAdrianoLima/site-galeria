import { createClient } from "redis";

export default class RedisClient {
  #client;

  constructor() {
    try {
      const password = process.env.NEXT_PUBLIC_REDIS_PASSWORD || "";

      this.#client = createClient({
        password,
        socket: {
          host: "redis-13154.c308.sa-east-1-1.ec2.cloud.redislabs.com",
          port: 13154,
        },
      });
    } catch (e) {
      throw e;
    }
  }

  async #Connect() {
    if (!this.#client.isOpen) {
      await this.#client.connect();
    }
  }

  async #Close() {
    if (this.#client.isOpen) {
      await this.#client.quit();
    }
  }

  async getDataFromCache(key = "") {
    try {
      await this.#Connect();

      const cacheData = await this.#client.get(key);

      if (cacheData) {
        await this.#Close();

        return JSON.parse(cacheData);
      } else {
        throw new Error("Nenhum dado encontrado");
      }
    } catch (e) {
      await this.#Close();
      return undefined;
    }
  }

  async fetchData(key = "", data = {}) {
    try {
      await this.#Connect();

      this.#client.setEx(key, 3600, JSON.stringify(data));
    } catch (e) {
      this.#Close();
      throw e;
    }
  }
}
