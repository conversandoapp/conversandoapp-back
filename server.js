import express from "express";
import { google } from "googleapis";
import cors from "cors";

const app = express();
app.use(cors());

const PORT = process.env.PORT || 3000;

// 🔑 Variables de entorno que debes configurar en Render
const SHEET_ID = process.env.SHEET_ID;
const CLIENT_EMAIL = process.env.CLIENT_EMAIL;
const PRIVATE_KEY = process.env.PRIVATE_KEY.replace(/\\n/g, "\n"); 

// Autenticación con Google Sheets
const auth = new google.auth.JWT(
  CLIENT_EMAIL,
  null,
  PRIVATE_KEY,
  ["https://www.googleapis.com/auth/spreadsheets.readonly"]
);
const sheets = google.sheets({ version: "v4", auth });

// Endpoint para traer preguntas
app.get("/api/questions", async (req, res) => {
  try {
    const range = "Hoja1!A2:C"; // ajusta a tu hoja y columnas
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SHEET_ID,
      range,
    });

    const rows = response.data.values || [];
    const questions = rows.map(([id, question, answer]) => ({
      id,
      question,
      answer,
    }));

    res.json({ questions });
  } catch (error) {
    console.error("❌ Error leyendo Google Sheets:", error);
    res.status(500).json({ error: "Error obteniendo preguntas" });
  }
});

app.listen(PORT, () => {
  console.log(`✅ Server corriendo en puerto ${PORT}`);
});
