import express from "express";

const app = express();
const PORT = process.env.PORT || 3000;

app.get("/prices", (req, res) => {
  res.json({
    gram24: {
      alis: 2450.5,
      nakit: 2550.0,
      kredi: 2580.0
    },
    kur: {
      has: 2480.0,
      dolar: 32.45,
      euro: 35.1,
      ons: 2034.2
    },
    updatedAt: new Date().toLocaleTimeString("tr-TR", {
      hour: "2-digit",
      minute: "2-digit"
    })
  });
});

app.listen(PORT, () => {
  console.log("Server running on port", PORT);
});
