import express from "express";
import axios from "axios";
import * as cheerio from "cheerio";

const app = express();
const PORT = process.env.PORT || 10000;

/* ===============================
   YARDIMCI FONKSİYON
================================ */
function temizle(text) {
  if (!text) return null;
  const t = text
    .replace(/\./g, "")
    .replace(",", ".")
    .replace("TL", "")
    .trim();
  const n = parseFloat(t);
  return isNaN(n) ? null : n;
}

/* ===============================
   TEST ENDPOINT
================================ */
app.get("/", (req, res) => {
  res.send("Giresun Altın API çalışıyor");
});

/* ===============================
   GERÇEK SCRAPING
================================ */
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

    /* ===============================
       1️⃣ SARRAFİYE (TABLO 0)
    ================================ */
    const sarrafiye = {};

    tables.eq(0).find("tr").each((_, row) => {
      const cols = $(row).find("td");
      if (cols.length < 3) return;

      const isim = $(cols[0]).text().trim().toUpperCase();
      if (!isim) return;

      sarrafiye[isim] = {
        alis: temizle($(cols[0]).text()),
        nakit: temizle($(cols[1]).text()),
        kredi: temizle($(cols[2]).text())
      };
    });

    /* ===============================
       2️⃣ GRAM (TABLO 1)
    ================================ */
    const gram24 = {};
    const gram22 = {};

    tables.eq(1).find("tr").each((_, row) => {
      const cols = $(row).find("td");
      if (cols.length < 3) return;

      const isim = $(cols[0]).text().toUpperCase();

      if (isim.includes("24")) {
        gram24.alis = temizle($(cols[0]).text());
        gram24.nakit = temizle($(cols[1]).text());
        gram24.kredi = temizle($(cols[2]).text());
      }

      if (isim.includes("22")) {
        gram22.alis = temizle($(cols[0]).text());
        gram22.nakit = temizle($(cols[1]).text());
        gram22.kredi = temizle($(cols[2]).text());
      }
    });

    /* ===============================
       3️⃣ KURLAR (TABLO 2)
    ================================ */
    const kur = {};

    tables.eq(2).find("tr").each((_, row) => {
      const cols = $(row).find("td");
      if (cols.length < 2) return;

      const isim = $(cols[0]).text().toUpperCase();
      const deger = temizle($(cols[1]).text());

      if (isim.includes("HAS")) kur.has = deger;
      if (isim.includes("DOLAR")) kur.dolar = deger;
      if (isim.includes("EURO")) kur.euro = deger;
      if (isim.includes("ONS")) kur.ons = deger;
    });

    /* ===============================
       SON JSON
    ================================ */
    const saat = new Date().toLocaleTimeString("tr-TR", {
      hour: "2-digit",
      minute: "2-digit"
    });

    res.json({
      gram24,
      gram22,
      sarrafiye,
      kur,
      updatedAt: saat
    });

  } catch (err) {
    res.status(500).json({
      error: "Veri çekilemedi",
      detail: err.message
    });
  }
});

/* ===============================
   SERVER
================================ */
app.listen(PORT, () => {
  console.log("SCRAPING AKTİF");
  console.log(`Server running on port ${PORT}`);
});
