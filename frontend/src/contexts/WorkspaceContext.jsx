import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import activityTracker from '../utils/ActivityTracker';

const WorkspaceContext = createContext();

// File system utilities
const getFileExtension = (filename) => {
  return filename.split('.').pop().toLowerCase();
};

const getLanguageFromExtension = (extension) => {
  const languageMap = {
    'py': 'python',
    'js': 'javascript',
    'java': 'java',
    'c': 'c'
  };
  return languageMap[extension] || 'python';
};

const getDefaultContent = (language) => {
  switch (language) {
    case 'python':
      return `# Welcome to CodeSnap Learning Workspace! 🎉\n# Start coding here...\n\nprint("Hello, World!")`;
    case 'javascript':
      return `// Welcome to CodeSnap Learning Workspace! 🎉\n// Start coding here...\n\nconsole.log("Hello, World!");`;
    case 'java':
      return `// Welcome to CodeSnap Learning Workspace! 🎉\n// Start coding here...\n\npublic class Main {\n    public static void main(String[] args) {\n        System.out.println("Hello, World!");\n    }\n}`;
    case 'c':
      return `// Welcome to CodeSnap Learning Workspace! 🎉\n// Start coding here...\n\n#include <stdio.h>\n\nint main() {\n    printf("Hello, World!\\n");\n    return 0;\n}`;
    default:
      return 'Welcome to CodeSnap Learning Workspace! 🎉';
  }
};

// Workspace Provider Component
export function WorkspaceProvider({ children }) {
  // Workspace state
  const [workspace, setWorkspace] = useState({
    name: 'My Learning Workspace',
    folders: [],
    files: [],
    activeFileId: null
  });

  const [currentFile, setCurrentFile] = useState(null);
  const [language, setLanguageState] = useState('python');

  // Custom setLanguage that also updates current file
  const setLanguage = useCallback((newLanguage) => {
    setLanguageState(newLanguage);

    // Update current file's language if it exists
    if (currentFile) {
      setWorkspace(prev => ({
        ...prev,
        files: prev.files.map(f =>
          f.id === currentFile.id
            ? { ...f, language: newLanguage, lastModified: new Date().toISOString() }
            : f
        )
      }));

      // Update the currentFile reference
      setCurrentFile(prev => prev ? { ...prev, language: newLanguage } : prev);
    }
  }, [currentFile]);

  // Load workspace from localStorage on mount
  useEffect(() => {
    const savedWorkspace = localStorage.getItem('codesnap_workspace');
    if (savedWorkspace) {
      try {
        const parsedWorkspace = JSON.parse(savedWorkspace);
        setWorkspace(parsedWorkspace);

        // Set active file if exists
        if (parsedWorkspace.activeFileId) {
          const activeFile = parsedWorkspace.files.find(f => f.id === parsedWorkspace.activeFileId);
          if (activeFile) {
            setCurrentFile(activeFile);
            setLanguage(activeFile.language);
          }
        }
      } catch (error) {
        console.error('Error loading workspace:', error);
        initializeDefaultWorkspace();
      }
    } else {
      initializeDefaultWorkspace();
    }
  }, []);

  // Save workspace to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('codesnap_workspace', JSON.stringify(workspace));
  }, [workspace]);

  // Initialize default workspace
  const initializeDefaultWorkspace = useCallback(() => {
    const defaultFile = {
      id: 'welcome',
      name: 'welcome.py',
      content: getDefaultContent('python'),
      language: 'python',
      lastModified: new Date().toISOString(),
      folderId: null
    };

    const newWorkspace = {
      name: 'My Learning Workspace',
      folders: [],
      files: [defaultFile],
      activeFileId: defaultFile.id
    };

    setWorkspace(newWorkspace);
    setCurrentFile(defaultFile);
    setLanguage('python');
  }, []);

  // File operations
  const createFile = useCallback((name, folderId = null, content = null, languageOverride = null) => {
    const extension = getFileExtension(name);
    const fileLanguage = languageOverride || getLanguageFromExtension(extension);
    const fileContent = content || getDefaultContent(fileLanguage);

    const newFile = {
      id: `file_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name,
      content: fileContent,
      language: fileLanguage,
      lastModified: new Date().toISOString(),
      folderId
    };

    setWorkspace(prev => ({
      ...prev,
      files: [...prev.files, newFile],
      activeFileId: newFile.id
    }));

    setCurrentFile(newFile);
    setLanguage(newFile.language);

    // Track activity
    activityTracker.trackFileCreated();

    return newFile;
  }, []);

  const createFolder = useCallback((name, parentId = null) => {
    const newFolder = {
      id: `folder_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name,
      parentId,
      lastModified: new Date().toISOString()
    };

    setWorkspace(prev => ({
      ...prev,
      folders: [...prev.folders, newFolder]
    }));

    return newFolder;
  }, []);

  const deleteFile = useCallback((fileId) => {
    setWorkspace(prev => {
      const newFiles = prev.files.filter(f => f.id !== fileId);
      let newActiveFileId = prev.activeFileId;

      // If we're deleting the active file, switch to another file or create a new one
      if (prev.activeFileId === fileId) {
        if (newFiles.length > 0) {
          newActiveFileId = newFiles[0].id;
        } else {
          // Create a new welcome file if no files left
          const welcomeFile = {
            id: 'welcome',
            name: 'welcome.py',
            content: getDefaultContent('python'),
            language: 'python',
            lastModified: new Date().toISOString(),
            folderId: null
          };
          newFiles.push(welcomeFile);
          newActiveFileId = welcomeFile.id;
        }
      }

      return {
        ...prev,
        files: newFiles,
        activeFileId: newActiveFileId
      };
    });

    // Update current file state
    setTimeout(() => {
      const updatedWorkspace = JSON.parse(localStorage.getItem('codesnap_workspace') || '{}');
      const activeFile = updatedWorkspace.files?.find(f => f.id === updatedWorkspace.activeFileId);
      if (activeFile) {
        setCurrentFile(activeFile);
        setLanguage(activeFile.language);
      }
    }, 0);
  }, []);

  const deleteFolder = useCallback((folderId) => {
    setWorkspace(prev => {
      // Remove folder and all its contents
      const newFolders = prev.folders.filter(f => f.id !== folderId && f.parentId !== folderId);
      const newFiles = prev.files.filter(f => f.folderId !== folderId);

      return {
        ...prev,
        folders: newFolders,
        files: newFiles
      };
    });
  }, []);

  const renameFile = useCallback((fileId, newName) => {
    setWorkspace(prev => ({
      ...prev,
      files: prev.files.map(f =>
        f.id === fileId
          ? { ...f, name: newName, lastModified: new Date().toISOString() }
          : f
      )
    }));

    // Update current file if it's the renamed one
    if (currentFile?.id === fileId) {
      setCurrentFile(prev => prev ? { ...prev, name: newName } : prev);
    }
  }, [currentFile]);

  const renameFolder = useCallback((folderId, newName) => {
    setWorkspace(prev => ({
      ...prev,
      folders: prev.folders.map(f =>
        f.id === folderId
          ? { ...f, name: newName, lastModified: new Date().toISOString() }
          : f
      )
    }));
  }, []);

  const openFile = useCallback((file) => {
    setWorkspace(prev => ({
      ...prev,
      activeFileId: file.id
    }));

    setCurrentFile(file);
    setLanguage(file.language);
  }, []);

  const updateFileContent = useCallback((fileId, content) => {
    setWorkspace(prev => ({
      ...prev,
      files: prev.files.map(f =>
        f.id === fileId
          ? { ...f, content, lastModified: new Date().toISOString() }
          : f
      )
    }));

    // Update current file if it's the active one
    if (currentFile?.id === fileId) {
      setCurrentFile(prev => prev ? { ...prev, content } : prev);
    }
  }, [currentFile]);

  // Import/Export operations
  const importFile = useCallback((file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const content = e.target.result;
          const extension = getFileExtension(file.name);
          const fileLanguage = getLanguageFromExtension(extension);

          const importedFile = createFile(file.name, null, content, fileLanguage);
          activityTracker.trackFileImported();
          resolve(importedFile);
        } catch (error) {
          reject(error);
        }
      };
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsText(file);
    });
  }, [createFile]);

  const exportFile = useCallback((fileId) => {
    const file = workspace.files.find(f => f.id === fileId);
    if (!file) return;

    const blob = new Blob([file.content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = file.name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [workspace.files]);

  // Get organized file structure (with folders)
  const getOrganizedFiles = useCallback(() => {
    const rootFiles = workspace.files.filter(f => !f.folderId);
    const folders = workspace.folders.filter(f => !f.parentId);

    return { rootFiles, folders };
  }, [workspace.files, workspace.folders]);

  const contextValue = {
    // State
    workspace,
    currentFile,
    language,
    setLanguage: setLanguage,

    // File operations
    createFile,
    createFolder,
    deleteFile,
    deleteFolder,
    renameFile,
    renameFolder,
    openFile,
    updateFileContent,

    // Import/Export
    importFile,
    exportFile,

    // Utilities
    getOrganizedFiles,
    initializeDefaultWorkspace
  };

  return (
    <WorkspaceContext.Provider value={contextValue}>
      {children}
    </WorkspaceContext.Provider>
  );
}

// Custom hook to use workspace context
export function useWorkspace() {
  const context = useContext(WorkspaceContext);
  if (!context) {
    throw new Error('useWorkspace must be used within a WorkspaceProvider');
  }
  return context;
}

export default WorkspaceContext;