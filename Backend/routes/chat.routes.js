import { aiResponser, resetNegotiation } from "../controller/chat.controller.js";
import { Router } from "express";

export const ChatResponse = Router();
ChatResponse.post("/aimessage", aiResponser);
ChatResponse.post("/reset", resetNegotiation);