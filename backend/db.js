import postgres from "postgres";
import dotenv from "dotenv";

dotenv.config();

const connectionString = process.env.DATABASE_URL;

// cria conexão com o banco
const sql = postgres(connectionString, {
  ssl: "require", // supabase exige SSL
});

export default sql;
