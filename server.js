require("dotenv").config();

const express = require("express");
const axios = require("axios");
const mongoose = require("mongoose");
const cors = require("cors");
const { v4: uuidv4 } = require("uuid");

const app = express();

app.use(express.json());
app.use(cors());

/* =========================
   MONGODB CONNECT
========================= */

mongoose.connect(process.env.MONGO_URI)
.then(() => console.log("MongoDB Connected"))
.catch(err => console.log(err));

/* =========================
   API KEY SCHEMA
========================= */

const apiKeySchema = new mongoose.Schema({
  key: String,
  expiresAt: Date,
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const ApiKey = mongoose.model("ApiKey", apiKeySchema);

/* =========================
   GENERATE API KEY
========================= */

function generateKey() {
  return "vernex-" + uuidv4().replace(/-/g, "").slice(0, 20);
}

/* =========================
   VALIDATE KEY
========================= */

async function validateKey(req, res, next) {

  const key = req.query.key;

  if (!key) {
    return res.status(401).json({
      status: false,
      message: "API Key Missing"
    });
  }

  const data = await ApiKey.findOne({ key });

  if (!data) {
    return res.status(403).json({
      status: false,
      message: "Invalid API Key"
    });
  }

  if (new Date() > data.expiresAt) {

    await ApiKey.deleteOne({ key });

    return res.status(403).json({
      status: false,
      message: "API Key Expired"
    });
  }

  next();
}

/* =========================
   HOME
========================= */

app.get("/", (req, res) => {

  res.json({
    status: true,
    owner: "VERNEX API",
    message: "Server Running Successfully"
  });

});

/* =========================
   GENERATE KEY
========================= */

app.get("/generate", async (req, res) => {

  try {

    const admin = req.query.admin;
    const days = parseInt(req.query.days || 30);

    if (admin !== process.env.ADMIN_KEY) {
      return res.status(401).json({
        status: false,
        message: "Unauthorized"
      });
    }

    const key = generateKey();

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + days);

    await ApiKey.create({
      key,
      expiresAt
    });

    res.json({
      status: true,
      owner: "VERNEX API",
      api_key: key,
      expires_at: expiresAt
    });

  } catch (err) {

    res.json({
      status: false,
      error: err.message
    });

  }

});

/* =========================
   KEY INFO
========================= */

app.get("/keyinfo", validateKey, async (req, res) => {

  try {

    const key = req.query.key;

    const data = await ApiKey.findOne({ key });

    res.json({
      status: true,
      owner: "VERNEX API",
      key: data.key,
      expires_at: data.expiresAt,
      created_at: data.createdAt
    });

  } catch (err) {

    res.json({
      status: false,
      error: err.message
    });

  }

});

/* =========================
   EMAIL API
========================= */

app.get("/api/email", validateKey, async (req, res) => {

  try {

    const email = req.query.email;

    if (!email) {
      return res.json({
        status: false,
        message: "Email Required"
      });
    }

    const url =
      `https://ft-osint-api.duckdns.org/api/email?key=ft-rahun2m&email=${email}`;

    const response = await axios.get(url);

    let data = response.data;

    /* =========================
       REMOVE UNWANTED TEXT
    ========================= */

    let cleaned = JSON.stringify(data);

    cleaned = cleaned.replace(/@ftgamer2/gi, "");
    cleaned = cleaned.replace(/https:\/\/t\.me\/lynx_api/gi, "");
    cleaned = cleaned.replace(/lynx_api/gi, "");

    data = JSON.parse(cleaned);

    /* =========================
       FINAL RESPONSE
    ========================= */

    res.json({
      status: true,
      owner: "VERNEX API BY VERNEX",
      result: data
    });

  } catch (err) {

    res.status(500).json({
      status: false,
      error: err.message
    });

  }

});

/* =========================
   AUTO DELETE EXPIRED KEYS
========================= */

setInterval(async () => {

  await ApiKey.deleteMany({
    expiresAt: {
      $lt: new Date()
    }
  });

  console.log("Expired Keys Removed");

}, 60000);

/* =========================
   START SERVER
========================= */

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server Started On Port ${PORT}`);
});
