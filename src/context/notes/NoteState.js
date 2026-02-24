import React, { useState, useEffect } from 'react';
import NoteContext from './NoteContext';

const NoteState = (props) => {
  const host = process.env.NODE_ENV === 'production'
    ? 'https://apnibook-backend.onrender.com'
    : 'http://localhost:5000';

  const [notes, setNotes] = useState([]);
  const [user, setUser] = useState(null);
  const [isPremium, setIsPremium] = useState(false);
  const [loading, setLoading] = useState(false);
  const [folders, setFolders] = useState([]); // Folders now include id, name, and parentFolder

  // Fetch user data
  const getUser = async () => {
    try {
      const response = await fetch(`${host}/api/auth/getuser`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'auth-token': localStorage.getItem('token'),
        },
      });
      const data = await response.json();
      setUser(data);
      setIsPremium(data?.isPremium || false);
    } catch (error) {
      console.error('Failed to fetch user info:', error);
    }
  };

  // Upgrade to Premium
  const upgradeToPremium = async () => {
    try {
      const response = await fetch(`${host}/api/payment/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'auth-token': localStorage.getItem('token'),
        },
        body: JSON.stringify({}),
      });
      const data = await response.json();
      if (data.success) {
        setIsPremium(true);
        await getUser();
      }
    } catch (error) {
      console.error('Upgrade failed:', error);
    }
  };

  // Get all notes
  const getNotes = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${host}/api/notes/fetchallnotes`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'auth-token': localStorage.getItem('token'),
        },
      });
      const json = await response.json();
      const validNotes = Array.isArray(json) ? json.filter(
        (note) => note && note.uid && typeof note.title === 'string'
      ) : [];
      setNotes(validNotes);
      setLoading(false);
    } catch (error) {
      console.error('Failed to fetch notes', error);
      setNotes([]);
      setLoading(false);
    }
  };

  // Add a note
  const addNote = async (title, description, tag) => {
    try {
      setLoading(true);
      const response = await fetch(`${host}/api/notes/addnote`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'auth-token': localStorage.getItem('token'),
        },
        body: JSON.stringify({ title, description, tag }),
      });
      const newNote = await response.json();
      setNotes([...notes, newNote]);
      setLoading(false);
    } catch (error) {
      console.error('Failed to add note', error);
      setLoading(false);
    }
  };

  // Delete a note
  const deleteNote = async (uid) => {
    try {
      setLoading(true);
      await fetch(`${host}/api/notes/deletenote/${uid}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'auth-token': localStorage.getItem('token'),
        },
      });
      const newNotes = notes.filter(note => note.uid !== uid);
      setNotes(newNotes);
      setLoading(false);
    } catch (error) {
      console.error('Failed to delete note', error);
      setLoading(false);
    }
  };

  // Edit a note
const editNote = async (uid, title, description, tag) => {
  try {
    if (!uid || typeof title !== "string" || typeof description !== "string") {
      console.error("Invalid input for editNote:", { uid, title, description, tag });
      return false;
    }

    setLoading(true);

    // Optimistically update the note
    setNotes((prevNotes) =>
      prevNotes.map((note) =>
        note.uid === uid
          ? { ...note, title, description, tag, updatedAt: new Date().toISOString() }
          : note
      )
    );

    const response = await fetch(`${host}/api/notes/updatenote/${uid}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "auth-token": localStorage.getItem("token"),
      },
      body: JSON.stringify({ title, description, tag }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error(`Failed to update note: ${response.status}`, errorData);
   
      setLoading(false);
      return false;
    }

    const updatedNote = await response.json();
    if (updatedNote && updatedNote.uid && typeof updatedNote.title === "string") {
      setNotes((prevNotes) =>
        prevNotes.map((note) =>
          note.uid === uid ? { ...note, ...updatedNote } : note
        )
      );
      setLoading(false);
      return true;
    } else {
      console.error("Invalid note data from backend:", updatedNote);
     
      setLoading(false);
      return false;
    }
  } catch (error) {
    console.error("Failed to edit note:", error.message);
 
    setLoading(false);
    return false;
  }
};
  // Get all folders
  const getFolders = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${host}/api/folders`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'auth-token': localStorage.getItem('token'),
        },
      });
      const json = await response.json();
      // Expect folders to be an array of objects with id, name, and parentFolder
      setFolders(Array.isArray(json) ? json : []);
      setLoading(false);
    } catch (error) {
      console.error('Failed to fetch folders', error);
      setFolders([]);
      setLoading(false);
    }
  };

  // Add a folder
  const addFolder = async (name) => {
    try {
      setLoading(true);
      const response = await fetch(`${host}/api/folders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'auth-token': localStorage.getItem('token'),
        },
        body: JSON.stringify({ name }),
      });
      const newFolder = await response.json();
      if (newFolder.error) {
        console.error('Folder creation error:', newFolder.error);
        setLoading(false);
        return false;
      }
      await getFolders();
      setLoading(false);
      return true;
    } catch (error) {
      console.error('Failed to add folder', error);
      setLoading(false);
      return false;
    }
  };

  // Delete a folder
  const deleteFolder = async (folderId) => {
    try {
      setLoading(true);
      const response = await fetch(`${host}/api/folders/${folderId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'auth-token': localStorage.getItem('token'),
        },
      });
      if (!response.ok) throw new Error('Failed to delete folder');
      await getFolders(); // Refresh folders
      setLoading(false);
      return true;
    } catch (error) {
      console.error('Failed to delete folder', error);
      setLoading(false);
      return false;
    }
  };

  // Update a folder
  const updateFolder = async (folderId, newName) => {
    try {
      setLoading(true);
      const response = await fetch(`${host}/api/folders/${folderId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'auth-token': localStorage.getItem('token'),
        },
        body: JSON.stringify({ name: newName }),
      });
      if (!response.ok) throw new Error('Failed to update folder');
      await getFolders(); // Refresh folders
      setLoading(false);
      return true;
    } catch (error) {
      console.error('Failed to update folder', error);
      setLoading(false);
      return false;
    }
  };

  // Move a folder to another folder
  const moveFolder = async (folderId, parentFolderId) => {
    try {
      setLoading(true);
      const response = await fetch(`${host}/api/folders/move`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'auth-token': localStorage.getItem('token'),
        },
        body: JSON.stringify({ folderId, parentFolderId }),
      });
      if (!response.ok) throw new Error('Failed to move folder');
      await getFolders(); // Refresh folders
      setLoading(false);
      return true;
    } catch (error) {
      console.error('Failed to move folder', error);
      setLoading(false);
      return false;
    }
  };

  // Move notes to folder
  const moveNotesToFolder = async (noteIds, folderId) => {
    try {
      setLoading(true);
      const response = await fetch(`${host}/api/notes/bulk-move`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'auth-token': localStorage.getItem('token'),
        },
        body: JSON.stringify({ noteIds, folderId }),
      });
      if (!response.ok) throw new Error('Failed to move notes');
      await getNotes(); // Refresh notes
      setLoading(false);
      return true;
    } catch (error) {
      console.error('Failed to move notes', error);
      setLoading(false);
      return false;
    }
  };

  // Bulk delete notes
  const bulkDeleteNotes = async (noteIds) => {
    try {
      setLoading(true);
      const response = await fetch(`${host}/api/notes/bulk-delete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'auth-token': localStorage.getItem('token'),
        },
        body: JSON.stringify({ noteIds }),
      });
      if (!response.ok) throw new Error('Failed to delete notes');
      setNotes((prev) => prev.filter((note) => !noteIds.includes(note.uid)));
      setLoading(false);
      return true;
    } catch (error) {
      console.error('Failed to delete notes', error);
      setLoading(false);
      return false;
    }
  };

  useEffect(() => {
    getUser();
    getFolders();
  }, []);

  return (
    <NoteContext.Provider
      value={{
        notes,
        user,
        isPremium,
        loading,
        folders,
        getNotes,
        addNote,
        deleteNote,
        editNote,
        getUser,
        upgradeToPremium,
        getFolders,
        addFolder,
        deleteFolder,
        updateFolder,
        moveFolder,
        moveNotesToFolder,
        bulkDeleteNotes,
      }}
    >
      {props.children}
    </NoteContext.Provider>
  );
};

export default NoteState;