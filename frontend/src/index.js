import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import "./styles/blog.css"; // Додайте цей рядок
import App from "./App";
import { BrowserRouter } from "react-router-dom";
// Додайте цей рядок
import 'leaflet/dist/leaflet.css';

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <BrowserRouter>
    <App />
  </BrowserRouter>
);