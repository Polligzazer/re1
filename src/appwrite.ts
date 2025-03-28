import { Client, Account, Databases, Storage } from "appwrite";

const APPWRITE_URL = import.meta.env.VITE_APPWRITE_URL;
console.log("VITE_APPWRITE_URL:", import.meta.env.VITE_APPWRITE_URL);
const APPWRITE_PROJECT_ID = import.meta.env.VITE_APPWRITE_PROJECT_ID;
const APPWRITE_DATABASE_ID = import.meta.env.VITE_APPWRITE_DATABASE_ID;
const APPWRITE_STORAGE_BUCKET_ID = import.meta.env.VITE_APPWRITE_STORAGE_BUCKET_ID;


if (!APPWRITE_URL || !APPWRITE_PROJECT_ID || !APPWRITE_DATABASE_ID || !APPWRITE_STORAGE_BUCKET_ID) {
  console.error("❗ Missing required Appwrite environment variables. Check your .env file.");
}

const client = new Client();
client
  .setEndpoint(import.meta.env.VITE_APPWRITE_URL)
  .setProject(import.meta.env.VITE_APPWRITE_PROJECT_ID);

const account = new Account(client);
const databases = new Databases(client);
const apwstorage = new Storage(client);  

export { client, account, databases, apwstorage, APPWRITE_STORAGE_BUCKET_ID, APPWRITE_PROJECT_ID };