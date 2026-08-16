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
  const slashAliasedPages = [
    { path: "/reviews", element: <ReviewsPage /> },
    { path: "/instructions", element: <InstructionsPage /> },
    { path: "/mcp", element: <McpPage /> },
    { path: "/architecture", element: <ArchitecturePage /> },
    { path: "/about", element: <AboutPage /> },
    { path: "/terms", element: <TermsPage /> },
    { path: "/privacy", element: <PrivacyPage /> },
    { path: "/admin/downloads", element: <AdminDownloadsPage /> }
  ] as const;

  return (
    <div className="site-shell" style={themeStyle}>
      <NavBar />
      <main>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          {slashAliasedPages.flatMap(({ path, element }) => [
            <Route key={path} path={path} element={element} />,
            <Route key={`${path}/`} path={`${path}/`} element={element} />
          ])}
        </Routes>
      </main>
      <Footer />
    </div>
  );
}
