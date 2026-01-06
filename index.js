app.get("/prices", async (req, res) => {
  try {
    const url = "https://giresunkuyumculardernegi.com/CurrentPrices.aspx";

    const { data: html } = await axios.get(url, {
      headers: {
        "User-Agent": "Mozilla/5.0"
      }
    });

    const $ = cheerio.load(html);
    const tables = $("table");

    /* =====================
       SARRAFİYE (TABLO 0)
    ====================== */
    const sarrafiye = {};

    tables.eq(0).find("tr").each((_, row) => {
      const tds = $(row).find("td");
      if (tds.length < 4) return;

      const isim = $(tds[0]).text().trim();
      if (!isim || isim.match(/^\d/)) return; // sayıyla başlıyorsa atla

      sarrafiye[isim] = {
        alis: temizle($(tds[1]).text()),
        nakit: temizle($(tds[2]).text()),
        kredi: temizle($(tds[3]).text())
      };
    });

    /* =====================
       GRAM (TABLO 1)
    ====================== */
    let gram24 = {}, gram22 = {};

    tables.eq(1).find("tr").each((_, row) => {
      const tds = $(row).find("td");
      if (tds.length < 4) return;

      const isim = $(tds[0]).text().toUpperCase();

      if (isim.includes("24")) {
        gram24 = {
          alis: temizle($(tds[1]).text()),
          nakit: temizle($(tds[2]).text()),
          kredi: temizle($(tds[3]).text())
        };
      }

      if (isim.includes("22")) {
        gram22 = {
          alis: temizle($(tds[1]).text()),
          nakit: temizle($(tds[2]).text()),
          kredi: temizle($(tds[3]).text())
        };
      }
    });

    /* =====================
       KURLAR (TABLO 2)
    ====================== */
    const kur = {};

    tables.eq(2).find("tr").each((_, row) => {
      const tds = $(row).find("td");
      if (tds.length < 2) return;

      const isim = $(tds[0]).text().toUpperCase();
      const deger = temizle($(tds[1]).text());

      if (isim.includes("HAS")) kur.has = deger;
      if (isim.includes("DOLAR")) kur.dolar = deger;
      if (isim.includes("EURO")) kur.euro = deger;
      if (isim.includes("ONS")) kur.ons = deger;
    });

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
