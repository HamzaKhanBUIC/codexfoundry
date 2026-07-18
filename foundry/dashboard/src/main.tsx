import { FluentProvider, webLightTheme } from "@fluentui/react-components";
import { createRoot } from "react-dom/client";
import { App } from "./App";
import "./styles.css";

createRoot(document.getElementById("root")!).render(
  <FluentProvider theme={webLightTheme} className="foundry-theme">
    <App />
  </FluentProvider>,
);
