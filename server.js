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
      `https://ft-osint-api.duckdns.org/api/vehicle?key=ft-rahun2m&vehicle=${vehicle}`
    );

    let data = JSON.stringify(response.data);

    // Remove @ftgamer2
    data = data.replace(/@ftgamer2/gi, "");

    // Add @vernexzzz
    data = data + " @vernexzzz";

    res.send(data);

  } catch (error) {
    res.status(500).json({
      error: "Failed to fetch vehicle data"
    });
  }
});

app.get("/", (req, res) => {
  res.send("API is running");
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
