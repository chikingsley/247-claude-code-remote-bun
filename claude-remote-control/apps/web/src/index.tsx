import { createRoot } from "react-dom/client";
import { App } from "./App";
import "@fontsource-variable/geist";
import "@fontsource-variable/geist-mono";
import "./app/globals.css";
import "./styles/design-system.css";

createRoot(document.getElementById("root")!).render(<App />);
