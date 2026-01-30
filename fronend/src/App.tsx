import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { HomePage } from "./pages/HomePage";
import { RegisterPage } from "./pages/RegisterPage";
import { LoginPage } from "./pages/LoginPage";
import { DeskLayout } from "./pages/DeskLayout";
import { CampaignsPage } from "./pages/desk/CampaignsPage";
import { SessionsPage } from "./pages/desk/SessionsPage";
import { CampaignNotesPage } from "./pages/desk/CampaignNotesPage";
import { StorylinePage } from "./pages/desk/StorylinePage";
import { CharactersPage } from "./pages/desk/CharactersPage";
import { ChatPage } from "./pages/desk/ChatPage";
import "./index.css";

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/desk" element={<DeskLayout />}>
          <Route index element={<Navigate to="/desk/campaigns" replace />} />
          <Route path="campaigns" element={<CampaignsPage />} />
          <Route path="sessions" element={<SessionsPage />} />
          <Route path="notes" element={<CampaignNotesPage />} />
          <Route path="storyline" element={<StorylinePage />} />
          <Route path="characters" element={<CharactersPage />} />
          <Route path="chat" element={<ChatPage />} />
        </Route>
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/login" element={<LoginPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
