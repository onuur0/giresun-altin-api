import express from "express";
import axios from "axios";
import * as cheerio from "cheerio";
import cors from "cors";

const app = express();
app.use(cors());

const PORT = process.env.PORT || 3000;

// Sayı temizleme fonksiyonu
const temizle = (text) => {
    if (!text) return 0.0;
    const temizMetin = text.replace(/\./g, "").replace(",", ".").trim();
    const sayi = parseFloat(temizMetin);
    return isNaN(sayi) ? 0.0 : sayi;
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

        // === 1. SARRAFİYE ===
        const sarrafiye = [];
        tables.eq(0).find("tr").each((_, row) => {
            const tds = $(row).find("td");
            if (tds.length >= 3) { 
                const isim = $(row).find("th").text().trim(); 
                if (isim && isim !== "Sarrafiyeler") {
                     sarrafiye.push({
                        tur: isim,
                        alis: temizle($(tds[0]).text()),
                        satis: temizle($(tds[1]).text()),
                        krediSatis: temizle($(tds[2]).text())
                    });
                }
            }
        });

        // === 2. GRAM ALTINLAR ===
        const gramAltinlar = [];
        tables.eq(1).find("tr").each((_, row) => {
            const tds = $(row).find("td");
            if (tds.length >= 3) {
                const isim = $(row).find("th").text().trim();
                if (isim && isim !== "Gram Fiyatlar") {
                    gramAltinlar.push({
                        tur: isim,
                        alis: temizle($(tds[0]).text()),
                        satis: temizle($(tds[1]).text()),
                        krediSatis: temizle($(tds[2]).text())
                    });
                }
            }
        });

        // === 3. KURLAR ===
        const kurlar = {};
        tables.eq(2).find("tr").each((_, row) => {
            const tds = $(row).find("td");
            const th = $(row).find("th");
            
            if (th.length > 0 && tds.length > 0) {
                const isim = th.text().toUpperCase().trim();
                const deger = temizle(tds.eq(0).text());

                if (isim.includes("HAS")) kurlar.has = deger;
                if (isim.includes("DOLAR")) kurlar.dolar = deger;
                if (isim.includes("EURO")) kurlar.euro = deger;
                if (isim.includes("ONS")) kurlar.ons = deger;
            }
        });

        const guncellemeSaati = $("#ContentPlaceHolder1_LabelUpdateDate").text().trim();

        res.json({
            basari: true,
            sonGuncelleme: guncellemeSaati,
            veri: {
                sarrafiye: sarrafiye,
                gram: gramAltinlar,
                kurlar: kurlar
            }
        });

    } catch (err) {
        console.error("Hata:", err.message);
        res.status(500).json({
            basari: false,
            mesaj: "Veri çekilemedi: " + err.message
        });
    }
});

app.listen(PORT, () => {
    console.log(`Sunucu ${PORT} portunda çalışıyor...`);
});
