app.get("/prices", async (req, res) => {
  try {
    const url = "https://www.giresunkuyumculardernegi.com/CurrentPrices.aspx";

    const { data } = await axios.get(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"
      }
    });

    const $ = cheerio.load(data);

    const prices = {};

    $("table tbody tr").each((_, row) => {
      const name = $(row).find("th.text-left").text().trim();

      if (!name) return;

      const tds = $(row).find("td.text-danger");

      prices[name] = {
        alis: $(tds[0]).text().trim(),
        nakit: $(tds[1]).text().trim(),
        kredi: $(tds[2]).text().trim()
      };
    });

    res.json({
      source: "giresun-kuyumcular-odasi",
      updatedAt: new Date().toLocaleTimeString("tr-TR"),
      prices
    });
  } catch (error) {
    res.status(500).json({
      error: "Veri çekilemedi",
      detail: error.message
    });
  }
});
