import express from "express";
import axios from "axios";
import * as cheerio from "cheerio";
import cors from "cors";

const app = express();
app.use(cors());

const PORT = process.env.PORT || 3000;

// Sayı temizleme fonksiyonu
const temizle = (text) => {
    if (!text) return 0;
    const temiz = text.replace(/\./g, "").replace(",", ".").trim();
    return parseFloat(temiz) || 0;
};

app.get("/prices", async (req, res) => {
    try {
        const url = "https://www.giresunkuyumculardernegi.com/CurrentPrices.aspx";
        const { data: html } = await axios.get(url, {
            headers: {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36"
            }
        });

        const $ = cheerio.load(html);
        const tables = $("table");

        const sarrafiye = [];
        tables.eq(0).find("tbody tr").each((_, row) => {
            const tds = $(row).find("td, th");
            if (tds.length >= 4) {
                const isim = $(tds[0]).text().trim();
                if (isim && !isim.includes("Sarrafiyeler")) {
                    sarrafiye.push({
                        isim: isim,
                        alis: temizle($(tds[1]).text()),
                        nakit: temizle($(tds[2]).text()),
                        kredi: temizle($(tds[3]).text())
                    });
                }
            }
        });

        const gramFiyatlar = [];
        tables.eq(1).find("tbody tr").each((_, row) => {
            const tds = $(row).find("td, th");
            if (tds.length >= 4) {
                const isim = $(tds[0]).text().trim();
                if (isim && !isim.includes("Gram Fiyatlar")) {
                    gramFiyatlar.push({
                        isim: isim,
                        alis: temizle($(tds[1]).text()),
                        nakit: temizle($(tds[2]).text()),
                        kredi: temizle($(tds[3]).text())
                    });
                }
            }
        });

        const kurlar = {};
        tables.eq(2).find("tbody tr").each((_, row) => {
            const tds = $(row).find("td, th");
            if (tds.length >= 2) {
                const isim = $(tds[0]).text().toUpperCase();
                const deger = temizle($(tds[1]).text());
                if (isim.includes("HAS")) kurlar.has = deger;
                if (isim.includes("DOLAR")) kurlar.dolar = deger;
                if (isim.includes("EURO")) kurlar.euro = deger;
                if (isim.includes("ONS")) kurlar.ons = deger;
            }
        });

        const guncelleme = $("#ContentPlaceHolder1_LabelUpdateDate").text().trim();

        res.json({
            success: true,
            updatedAt: guncelleme,
            data: { sarrafiye, gramFiyatlar, kurlar }
        });

    } catch (err) {
        res.status(500).json({
            success: false,
            error: "Veri çekilemedi",
            message: err.message
        });
    }
});

app.listen(PORT, () => {
    console.log(`Sunucu ${PORT} portunda aktif.`);
});
