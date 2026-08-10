import { Navigate, Route, Routes } from "react-router-dom";
import { Layout } from "./components/Layout";
import { DEFAULT_VERSION } from "./hooks/usePreferredVersion";
import { BibleReader } from "./pages/BibleReader";
import { ChatPage } from "./pages/ChatPage";
import { GuardadosPage } from "./pages/GuardadosPage";

export function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Navigate to="/biblia" replace />} />
        <Route path="/biblia" element={<Navigate to={`/biblia/${DEFAULT_VERSION}/génesis/1`} replace />} />
        <Route path="/biblia/:version/:book/:chapter" element={<BibleReader />} />
        <Route path="/chat" element={<ChatPage />} />
        <Route path="/guardado" element={<GuardadosPage />} />
      </Route>
    </Routes>
  );
}
