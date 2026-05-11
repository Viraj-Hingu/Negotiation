import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";
import { AichatConextProvider } from "./context.chat.jsx";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <AichatConextProvider>
      <App />
    </AichatConextProvider>
  </StrictMode>,
);
