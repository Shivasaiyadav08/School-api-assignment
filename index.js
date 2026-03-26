require("dotenv").config();
import express from "express";
import { createConnection } from "mysql2";
import { json } from "body-parser";
import cors from "cors";

const app = express();
app.use(json());
app.use(cors());

// MySQL Connection
const db = createConnection({
  host: "localhost",
  user: process.env.DB_USER,
  password: process.env.PASSWORD_DB,
  database: "school_db"
});

db.connect(err => {
  if (err) {
    console.log("DB Error:", err);
  } else {
    console.log("MySQL Connected");
  }
});

// 📍 Distance Formula (Haversine)
function getDistance(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) *
    Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) *
    Math.sin(dLon / 2);

  return R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
}

// ✅ Add School API
app.post("/addSchool", (req, res) => {
  const { name, address, latitude, longitude } = req.body;

  if (!name || !address || latitude == null || longitude == null) {
    return res.status(400).json({ message: "All fields required" });
  }

  const sql = "INSERT INTO schools (name, address, latitude, longitude) VALUES (?, ?, ?, ?)";

  db.query(sql, [name, address, latitude, longitude], (err, result) => {
    if (err) {
      return res.status(500).json({ error: err });
    }
    res.json({ message: "School added successfully" });
  });
});

// ✅ List Schools API
app.get("/listSchools", (req, res) => {
  const { latitude, longitude } = req.query;

  if (!latitude || !longitude) {
    return res.status(400).json({ message: "Latitude & Longitude required" });
  }

  db.query("SELECT * FROM schools", (err, results) => {
    if (err) return res.status(500).json(err);

    const sorted = results.map(school => {
      const distance = getDistance(
        latitude,
        longitude,
        school.latitude,
        school.longitude
      );
      return { ...school, distance };
    }).sort((a, b) => a.distance - b.distance);

    res.json(sorted);
  });
});

app.listen(3000, () => {
  console.log("Server running on port 3000");
});