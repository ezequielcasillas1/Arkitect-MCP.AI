import type { CSSProperties } from "react";
import { Route, Routes } from "react-router-dom";
import { arkitectWindowsTheme, buildCssVariables } from "@arkitect/design-system";
import { NavBar } from "./components/NavBar";
import { Footer } from "./components/Footer";
import { LandingPage } from "./pages/LandingPage";
import { ReviewsPage } from "./pages/ReviewsPage";
import { InstructionsPage } from "./pages/InstructionsPage";
import { ArchitecturePage } from "./pages/ArchitecturePage";
import { AdminDownloadsPage } from "./features/download-tracking";

const themeStyle = buildCssVariables(arkitectWindowsTheme) as CSSProperties;

export function App() {
  return (
    <div className="site-shell" style={themeStyle}>
      <NavBar />
      <main>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/reviews" element={<ReviewsPage />} />
          <Route path="/instructions" element={<InstructionsPage />} />
          <Route path="/architecture" element={<ArchitecturePage />} />
          <Route path="/admin/downloads" element={<AdminDownloadsPage />} />
        </Routes>
      </main>
      <Footer />
    </div>
  );
}
