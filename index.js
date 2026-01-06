import express from "express";
import axios from "axios";
import * as cheerio from "cheerio";

const app = express();
const PORT = process.env.PORT || 3000;

/**
 * TEST
 */
app.get("/", (req, res) => {
  res.send("Giresun Altın API çalışıyor");
});

/**
 * GERÇEK SCRAPING – ANDROID MANTIĞININ BİREBİR KARŞILIĞI
 */
app.get("/prices", async (req, res) => {
  try {
    const url = "https://giresunkuyumculardernegi.com/CurrentPrices.aspx";

    const { data: html } = await axios.get(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"
      }
    });

    const $ = cheerio.load(html);
    const tables = $("table");

    // 🔹 Android'deki hedef satırlar
    const hedef1 = [1, 9, 10, 11, 12]; // Sarrafiye
    const hedef2 = [1, 4];            // Gram
    const hedef3 = [1, 2, 3, 4];       // Kur

    const tablo1 = [];
    const tablo2 = [];
    const tablo3 = [];

    const temizle = (text) =>
      parseFloat(text.replace(/\./g, "").replace(",", "."));

    // ===== TABLO 1 – SARRAFİYE =====
    tables.eq(0).find("tr").each((i, row) => {
      if (!hedef1.includes(i)) return;

      const cols = $(row).find("td");
      if (cols.length < 3) return;

      tablo1.push({
        alis: temizle($(cols[0]).text()),
        nakit: temizle($(cols[1]).text()),
        kredi: temizle($(cols[2]).text())
      });
    });

    // ===== TABLO 2 – GRAM =====
    tables.eq(1).find("tr").each((i, row) => {
      if (!hedef2.includes(i)) return;

      const cols = $(row).find("td");
      if (cols.length < 3) return;

      tablo2.push({
        alis: temizle($(cols[0]).text()),
        nakit: temizle($(cols[1]).text()),
        kredi: temizle($(cols[2]).text())
      });
    });

    // ===== TABLO 3 – KURLAR =====
    tables.eq(2).find("tr").each((i, row) => {
      if (!hedef3.includes(i)) return;

      const cols = $(row).find("td");
      if (cols.length < 2) return;

      tablo3.push(
        temizle($(cols[1]).text())
      );
    });

    // ===== ANDROID'DEKİ UI EŞLEŞMESİ =====
    res.json({
      gram24: {
        alis: tablo2[0]?.alis ?? null,
        nakit: tablo2[0]?.nakit ?? null,
        kredi: tablo2[0]?.kredi ?? null
      },
      gram22: {
        alis: tablo2[1]?.alis ?? null,
        nakit: tablo2[1]?.nakit ?? null,
        kredi: tablo2[1]?.kredi ?? null
      },
      kur: {
        has: tablo3[0] ?? null,
        dolar: tablo3[1] ?? null,
        euro: tablo3[2] ?? null,
        ons: tablo3[3] ?? null
      },
      updatedAt: new Date().toLocaleTimeString("tr-TR", {
        hour: "2-digit",
        minute: "2-digit"
      })
    });

  } catch (err) {
    res.status(500).json({
      error: "Veri çekilemedi",
      detail: err.message
    });
  }
});

app.listen(PORT, () => {
  console.log("Server running on port " + PORT);
});
