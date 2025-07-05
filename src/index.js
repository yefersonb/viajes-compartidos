// src/index.js
import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import { UserProvider } from "./contexts/UserContext"; // Ajuste: importa el UserProvider exportado
import "./index.css";

const container = document.getElementById("root");
const root = createRoot(container);

root.render(
  <React.StrictMode>
    <UserProvider>
      <App />
    </UserProvider>
  </React.StrictMode>
);
