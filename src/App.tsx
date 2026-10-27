import { lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/react";
import "./App.css";

const CharacterModel = lazy(() => import("./components/Character"));
const MainContainer = lazy(() => import("./components/MainContainer"));
const MyWorks = lazy(() => import("./pages/MyWorks"));
const CertificationsPage = lazy(() => import("./pages/CertificationsPage"));
const CvPage = lazy(() => import("./pages/CvPage"));
const LabIndex = lazy(() => import("./lab/LabIndex"));
const GameShell = lazy(() => import("./lab/GameShell"));
const NotFoundPage = lazy(() => import("./pages/NotFoundPage"));
const SherifChat = lazy(() => import("./components/SherifChat"));
import { LoadingProvider } from "./context/LoadingProvider";
import GlobalControlDock from "./components/control/GlobalControlDock";

const App = () => {
  return (
    <BrowserRouter>
      <Suspense fallback={null}>
        <SherifChat />
      </Suspense>
      <GlobalControlDock />
      <Routes>
        <Route
          path="/"
          element={
            <LoadingProvider>
              <Suspense>
                <MainContainer>
                  <Suspense>
                    <CharacterModel />
                  </Suspense>
                </MainContainer>
              </Suspense>
            </LoadingProvider>
          }
        />
        <Route
          path="/works"
          element={
            <Suspense fallback={null}>
              <MyWorks />
            </Suspense>
          }
        />
        <Route
          path="/certifications"
          element={
            <Suspense fallback={null}>
              <CertificationsPage />
            </Suspense>
          }
        />
        <Route
          path="/resume"
          element={
            <Suspense fallback={null}>
              <CvPage />
            </Suspense>
          }
        />
        <Route path="/lab" element={<Suspense fallback={null}><LabIndex /></Suspense>} />
        <Route path="/lab/:id" element={<Suspense fallback={null}><GameShell /></Suspense>} />
        <Route path="*" element={<Suspense fallback={null}><NotFoundPage /></Suspense>} />
      </Routes>
      <Analytics />
      <SpeedInsights />
    </BrowserRouter>
  );
};

export default App;
