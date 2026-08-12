import { Navigate, Route, Routes } from "react-router-dom";
import { Layout } from "./components/Layout";
import { ApocryphaPage } from "./pages/ApocryphaPage";
import { BibleReader } from "./pages/BibleReader";
import { BookSelectorPage } from "./pages/BookSelectorPage";
import { ChatPage } from "./pages/ChatPage";
import { GuardadosPage } from "./pages/GuardadosPage";

export function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Navigate to="/biblia" replace />} />
        <Route path="/biblia" element={<BookSelectorPage />} />
        <Route path="/biblia/:version/:book/:chapter" element={<BibleReader />} />
        <Route path="/apocrifos" element={<ApocryphaPage />} />
        <Route path="/chat" element={<ChatPage />} />
        <Route path="/guardado" element={<GuardadosPage />} />
      </Route>
    </Routes>
  );
}
