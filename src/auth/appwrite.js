import { Client, Account, Databases } from "appwrite";

export const client = new Client()
  .setEndpoint("https://sfo.cloud.appwrite.io/v1")
  .setProject("698189250030a2e96a0e");

export const account = new Account(client);
export const databases = new Databases(client);
