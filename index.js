import express from "express";
import axios from "axios";
import * as cheerio from "cheerio";
import cors from "cors";
import https from "https";

const DOVIZ_API = "https://open.er-api.com/v6/latest/TRY";


const app = express();
app.use(cors());

const PORT = process.env.PORT || 3000;

// ✅ CACHE DEĞİŞKENLERİ
let cachedData = null;
let lastFetchTime = 0;
const CACHE_DURATION = 30 * 1000; // 30 saniye

app.get("/", (req, res) => {
  res.send("API CALISIYOR");
});

const agent = new https.Agent({
  rejectUnauthorized: false
});

const temizle = (text) => {
  if (!text) return 0;
  return parseFloat(
    text.replace(/\./g, "").replace(",", ".").trim()
  ) || 0;
};

app.get("/prices", async (req, res) => {
  try {
    const now = Date.now();

    // ✅ CACHE VARSA DİREKT DÖN
    if (cachedData && (now - lastFetchTime < CACHE_DURATION)) {
      return res.json(cachedData);
    }

    const url = "https://www.giresunkuyumculardernegi.com/CurrentPrices.aspx";

    const { data } = await axios.get(url, {
      httpsAgent: agent,
      headers: { "User-Agent": "Mozilla/5.0" }
    });

    const $ = cheerio.load(data);
    const tables = $("table");

    if (tables.length < 3) {
      throw new Error("Tablolar bulunamadi");
    }

    const sarrafiye = [];
    tables.eq(0).find("tr").each((_, row) => {
      const tds = $(row).find("td");
      const th = $(row).find("th");
      if (tds.length >= 3 && th.text()) {
        sarrafiye.push({
          tur: th.text().trim(),
          alis: temizle(tds.eq(0).text()),
          satis: temizle(tds.eq(1).text()),
          krediSatis: temizle(tds.eq(2).text())
        });
      }
    });

    const gram = [];
    tables.eq(1).find("tr").each((_, row) => {
      const tds = $(row).find("td");
      const th = $(row).find("th");
      if (tds.length >= 3 && th.text()) {
        gram.push({
          tur: th.text().trim(),
          alis: temizle(tds.eq(0).text()),
          satis: temizle(tds.eq(1).text()),
          krediSatis: temizle(tds.eq(2).text())
        });
      }
    });

    const kurlar = {};
    tables.eq(2).find("tr").each((_, row) => {
      const th = $(row).find("th").text().toUpperCase();
      const td = temizle($(row).find("td").eq(0).text());
      if (th.includes("HAS")) kurlar.has = td;
      if (th.includes("DOLAR")) kurlar.dolar = td;
      if (th.includes("EURO")) kurlar.euro = td;
      if (th.includes("ONS")) kurlar.ons = td;

      
    });

    // 🔁 DOLAR / EURO 0 GELİRSE DIŞ API'DEN AL
if (!kurlar.dolar || kurlar.dolar === 0 || !kurlar.euro || kurlar.euro === 0) {
  try {
    const dovizRes = await axios.get(DOVIZ_API);
    const rates = dovizRes.data?.rates;

    if (rates?.USD && rates?.EUR) {
      kurlar.dolar = Number((1 / rates.USD).toFixed(2));
      kurlar.euro  = Number((1 / rates.EUR).toFixed(2));
    }
  } catch (err) {
    console.log("Döviz API hatası:", err.message);
  }
}


    const responseData = {
      basari: true,
      veri: { sarrafiye, gram, kurlar }
    };

    // ✅ CACHE’E YAZ
    cachedData = responseData;
    lastFetchTime = Date.now();

    res.json(responseData);

  } catch (e) {
    res.status(500).json({
      basari: false,
      hata: e.message
    });
  }
});

app.listen(PORT, () => {
  console.log("Server running on", PORT);
});
