import { createRoot } from "react-dom/client";
import "./index.css";
import LanguageProvider from "./i18n/LanguageProvider.jsx";
import GameApp from "./GameApp.jsx";
createRoot(document.getElementById("root")).render(
  <LanguageProvider>
    <GameApp />
  </LanguageProvider>,
);
