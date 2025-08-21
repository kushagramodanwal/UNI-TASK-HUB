// backend/routes/reviews.js
import express from "express";

const reviewRoutes = express.Router();

// Example GET route
reviewRoutes.get("/", (req, res) => {
  res.json({ message: "Reviews route working!" });
});

export default reviewRoutes;
