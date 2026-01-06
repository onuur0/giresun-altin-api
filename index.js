import express from "express";
import axios from "axios";
import * as cheerio from "cheerio";
import cors from "cors";
import https from "https";

const app = express();
app.use(cors());

const PORT = process.env.PORT || 3000;

app.get("/", (req, res) => {
  res.send("API ÇALIŞIYOR");
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
    const url = "https://www.giresunkuyumculardernegi.com/CurrentPrices.aspx";

    const { data } = await axios.get(url, {
      httpsAgent: agent,
      headers: { "User-Agent": "Mozilla/5.0" }
    });

    const $ = cheerio.load(data);
    const tables = $("table");

    if (tables.length < 3) {
      throw new Error("Tablolar eksik");
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

    res.json({ basari: true, veri: { sarrafiye, gram, kurlar } });

  } catch (e) {
    console.error(e.message);
    res.status(500).json({ basari: false, hata: e.message });
  }
});

app.listen(PORT, () => {
  console.log("Server running on", PORT);
});
