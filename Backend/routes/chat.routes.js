import {
  aiResponser,
  resetNegotiation,
  getProducts,
  switchProduct,
} from "../controller/chat.controller.js";
import { Router } from "express";

export const ChatResponse = Router();

ChatResponse.post("/aimessage", aiResponser);
ChatResponse.post("/reset", resetNegotiation);
ChatResponse.get("/products", getProducts);
ChatResponse.post("/switch/:id", switchProduct);