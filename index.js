import express from "express";
import axios from "axios";
import cheerio from "cheerio";

const app = express();
const PORT = process.env.PORT || 3000;

/**
 * TEST endpoint
 * API ayakta mı diye kontrol
 */
app.get("/", (req, res) => {
  res.send("Giresun Altın API çalışıyor");
});

/**
 * GERÇEK SCRAPING
 * Şimdilik örnek bir sayfadan veri çekiyoruz
 * (Bir sonraki adımda Giresun Kuyumcular Odası’na uyarlayacağız)
 */
app.get("/prices", async (req, res) => {
  try {
    const url = "https://www.doviz.com/altin/gram-altin";

    const { data } = await axios.get(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"
      }
    });

    const $ = cheerio.load(data);

    // Doviz.com sayfa yapısı (örnek)
    const fiyatText = $(".value").first().text().trim();

    res.json({
      source: "doviz.com",
      gram_altin: fiyatText,
      fetchedAt: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      error: "Veri çekilemedi",
      detail: error.message
    });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
