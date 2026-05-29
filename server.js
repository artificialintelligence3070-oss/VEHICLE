const express = require("express");
const axios = require("axios");

const app = express();

const PORT = process.env.PORT || 3000;

// Home Route
app.get("/", (req, res) => {
  res.send("Vehicle API Running Successfully");
});

// Vehicle Route
app.get("/vehicle", async (req, res) => {
  try {

    const vehicle = req.query.vehicle;

    if (!vehicle) {
      return res.status(400).json({
        status: false,
        message: "Vehicle number required"
      });
    }

    // Fetch original API
    const response = await axios.get(
      `https://ft-osint-api.duckdns.org/api/vehicle?key=ft-rahun2m&vehicle=${vehicle}`,
      {
        timeout: 10000
      }
    );

    let data = JSON.stringify(response.data);

    // Remove text
    data = data.replace(/@ftgamer2/gi, "");
    data = data.replace(/FtGamer2/gi, "");
    data = data.replace(/FtGamer/gi, "");

    // Convert back to JSON
    let jsonData = JSON.parse(data);

    // Add your custom tag
    jsonData.credit = "@vernexzzz";

    // Send response
    res.status(200).json(jsonData);

  } catch (error) {

    console.log(error.message);

    res.status(500).json({
      status: false,
      error: "API Failed",
      message: error.message
    });

  }
});

// Start Server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
