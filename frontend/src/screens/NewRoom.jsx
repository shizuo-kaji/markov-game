import React, { useState } from "react";
import { useApi } from '../../apiConfig.js';
import CreateRoom from "../components/CreateRoom.jsx";
import ReturnButton from '../components/ReturnButton.jsx';

export default function NewRoom({ onCreate, onReturn }) {
  const apiBase = useApi();
  const [loading, setLoading] = useState(false);

  // Callback to create a new room via API, then navigate back
  const handleCreate = async (roomData) => {
    console.log('Attempting to create room with data:', roomData);
    setLoading(true);
    try {
      const res = await fetch(`${apiBase}/rooms`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(roomData),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || 'Failed to create room.');
      }
      onCreate();
    } catch (error) {
      console.error('Error creating room:', error);
      alert('Error creating room: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
  <div 
      className="appWelcome"
    >
      <aside className="sidePanel">
      <h1 className="
        text-5xl 
        p-2 
        font-bold font-serif 
        drop-shadow"
      > Markovian<br />Royale </h1>
      <CreateRoom onCreate={handleCreate} loading={loading} />
      </aside>
      <ReturnButton onClick={onReturn} />
    </div>
  );
}