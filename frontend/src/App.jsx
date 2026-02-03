import { BrowserRouter, Routes, Route } from "react-router-dom";
import Landing from "./pages/Landing";
import Editor from "./pages/Editor";
import TutorChatbot from "./components/TutorChatbot";
import { WorkspaceProvider } from "./contexts/WorkspaceContext";
import { EditorProvider, useEditor } from "./contexts/EditorContext";

function GlobalTutorChatbot() {
  return <TutorChatbot />;
}

function App() {
  return (
    <EditorProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/editor" element={
            <WorkspaceProvider>
              <Editor />
            </WorkspaceProvider>
          } />
        </Routes>
      </BrowserRouter>
      {/* Global floating AI tutor, persists across page navigation */}
      <GlobalTutorChatbot />
    </EditorProvider>
  );
}

export default App;
