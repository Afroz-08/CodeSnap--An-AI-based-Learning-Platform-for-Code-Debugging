import React, { createContext, useContext, useState, useCallback } from 'react';

const EditorContext = createContext();

export function EditorProvider({ children }) {
  const [editorState, setEditorState] = useState({
    language: 'python',
    code: '',
    error: ''
  });

  const updateEditorState = useCallback((updates) => {
    setEditorState(prev => ({ ...prev, ...updates }));
  }, []);

  return (
    <EditorContext.Provider value={{ editorState, updateEditorState }}>
      {children}
    </EditorContext.Provider>
  );
}

export function useEditor() {
  const context = useContext(EditorContext);
  if (!context) {
    throw new Error('useEditor must be used within an EditorProvider');
  }
  return context;
}