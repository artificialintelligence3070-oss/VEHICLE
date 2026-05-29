const express = require("express");
const axios = require("axios");

const app = express();

const PORT = process.env.PORT || 3000;

app.get("/vehicle", async (req, res) => {
  try {
    const vehicle = req.query.vehicle;

    if (!vehicle) {
      return res.status(400).json({
        error: "Vehicle number is required"
      });
    }

    const response = await axios.get(
      `https://ft-osint-api.duckdns.org/api/vehicle?key=ft-rahun2m&vehicle=${vehicle}`,
      {
        timeout: 10000
      }
    );

    let data = JSON.stringify(response.data);

    // Remove @ftgamer2
    data = data.replace(/@ftgamer2/gi, "");

    // Convert back to JSON
    let jsonData = JSON.parse(data);

    // Add custom credit
    jsonData.credit = "@vernexzzz";

    res.json(jsonData);

  } catch (error) {
    console.log(error.message);

    res.status(500).json({
      error: "API failed",
      message: error.message
    });
  }
});

app.get("/", (req, res) => {
  res.send("API Running Successfully");
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
