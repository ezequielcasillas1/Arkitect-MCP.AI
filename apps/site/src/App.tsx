import type { CSSProperties } from "react";
import { Route, Routes } from "react-router-dom";
import { arkitectWindowsTheme, buildCssVariables } from "@arkitect/design-system";
import { NavBar } from "./components/NavBar";
import { Footer } from "./components/Footer";
import { LandingPage } from "./pages/LandingPage";
import { ReviewsPage } from "./pages/ReviewsPage";
import { InstructionsPage } from "./pages/InstructionsPage";
import { ArchitecturePage } from "./pages/ArchitecturePage";
import { McpPage } from "./pages/McpPage";
import { AboutPage } from "./pages/AboutPage";
import { TermsPage } from "./pages/TermsPage";
import { PrivacyPage } from "./pages/PrivacyPage";
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
          <Route path="/mcp" element={<McpPage />} />
          <Route path="/architecture" element={<ArchitecturePage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/terms" element={<TermsPage />} />
          <Route path="/privacy" element={<PrivacyPage />} />
          <Route path="/admin/downloads" element={<AdminDownloadsPage />} />
        </Routes>
      </main>
      <Footer />
    </div>
  );
}
