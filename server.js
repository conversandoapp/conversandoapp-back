import express from "express";
import { google } from "googleapis";
import cors from "cors";

const app = express();
app.use(cors());

const PORT = process.env.PORT || 3000;

// 🔑 Variables de entorno
const SHEET_ID = process.env.SHEET_ID;
const CLIENT_EMAIL = process.env.CLIENT_EMAIL;
const PRIVATE_KEY = process.env.PRIVATE_KEY
  ? process.env.PRIVATE_KEY.replace(/\\n/g, "\n")
  : null;

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

// 🔹 Endpoint para códigos (Hoja1, columna A)
app.get("/api/codes", async (req, res) => {
  try {
    console.log("📥 Request recibido en /api/codes");
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SHEET_ID,
      range: "Hoja1!A2:A", // solo códigos
    });

    const rows = response.data.values || [];
    const codes = rows.map(([code]) => code);

    console.log("📊 Códigos obtenidos:", codes.length);
    res.json({ codes });
  } catch (error) {
    console.error("❌ Error obteniendo códigos:", error.message);
    res.status(500).json({ error: "Error obteniendo códigos" });
  }
});

// 🔹 Endpoint para preguntas (Hoja2, columnas A y B)
app.get("/api/questions", async (req, res) => {
  try {
    console.log("📥 Request recibido en /api/questions");
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SHEET_ID,
      range: "Hoja2!A2:B", // id y pregunta
    });

    const rows = response.data.values || [];
    const questions = rows.map(([id, question]) => ({
      id,
      question,
    }));

    console.log("📊 Preguntas obtenidas:", questions.length);
    res.json({ questions });
  } catch (error) {
    console.error("❌ Error obteniendo preguntas:", error.message);
    res.status(500).json({ error: "Error obteniendo preguntas" });
  }
});

// 🔹 Endpoint wakeup
app.get("/wakeup", (req, res) => {
  console.log("👋 Wakeup recibido");
  res.send("👋 Wakeup OK");
});

app.listen(PORT, () => {
  console.log(`✅ Server corriendo en puerto ${PORT}`);
});
