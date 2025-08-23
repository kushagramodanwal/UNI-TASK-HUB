import express from "express";

const reviewRoutes = express.Router();

reviewRoutes.get("/", (req, res) => {
  res.json({ message: "Reviews route working!" });
});

export default reviewRoutes;
