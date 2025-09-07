import express from "express";
import { google } from "googleapis";
import cors from "cors";

const app = express();
app.use(cors());

const PORT = process.env.PORT || 3000;

// 🔑 Variables de entorno
const SHEET_ID = process.env.SHEET_ID;
const CLIENT_EMAIL = process.env.CLIENT_EMAIL;
const PRIVATE_KEY = process.env.PRIVATE_KEY ? process.env.PRIVATE_KEY.replace(/\\n/g, "\n") : null;

if (!SHEET_ID || !CLIENT_EMAIL || !PRIVATE_KEY) {
  console.error("❌ Faltan variables de entorno requeridas");
  process.exit(1);
}

// Autenticación con Google Sheets
const auth = new google.auth.JWT(
  CLIENT_EMAIL,
  null,
  PRIVATE_KEY,
  ["https://www.googleapis.com/auth/spreadsheets.readonly"]
);

const sheets = google.sheets({ version: "v4", auth });

// Middleware para loguear requests
app.use((req, res, next) => {
  console.log(`➡️ ${req.method} ${req.url}`);
  next();
});

// Endpoint wakeup
app.get("/wakeup", (req, res) => {
  console.log("👋 Wakeup recibido");
  res.send("Wakeup OK");
});

// Endpoint preguntas
app.get("/api/questions", async (req, res) => {
  try {
    console.log("📥 Request recibido en /api/questions");

    const range = "Hoja1!A2:C"; // ⚠️ Cambia "Hoja1" si tu hoja se llama distinto
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SHEET_ID,
      range,
    });

    console.log("📊 Filas obtenidas:", response.data.values?.length || 0);

    const rows = response.data.values || [];
    const questions = rows.map(([id, question, answer]) => ({
      id,
      question,
      answer,
    }));

    res.json({ questions });
  } catch (error) {
    console.error("❌ Error obteniendo preguntas:");
    console.error("🔎 message:", error.message);
    if (error.errors) console.error("🔎 details:", JSON.stringify(error.errors, null, 2));
    res.status(500).json({ error: "Error obteniendo preguntas" });
  }
});

app.listen(PORT, () => {
  console.log(`✅ Server corriendo en puerto ${PORT}`);
  console.log("📧 CLIENT_EMAIL:", CLIENT_EMAIL);
  console.log("📄 SHEET_ID:", SHEET_ID);
  console.log("🗝️ PRIVATE_KEY comienza con:", PRIVATE_KEY?.substring(0, 30));
});
