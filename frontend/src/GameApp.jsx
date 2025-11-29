// GameApp.jsx
import { useState, useCallback, useEffect } from "react";
import { useApi } from '../apiConfig.js';  // import API helper

import Welcome from "./screens/Welcome.jsx";
import Player from "./screens/Player.jsx";
import Waiting from "./screens/Waiting.jsx";
import Trophy from "./screens/Trophy.jsx";
import NewRoom from "./screens/NewRoom.jsx";
import RoomLobby from "./screens/RoomLobby.jsx";

export default function GameApp() {
  const apiBase = useApi();
  const [screen, setScreen] = useState("welcome");
  const [rooms, setRooms] = useState([]);  // list of available rooms
  const [lastTurnNumber, setLastTurnNumber] = useState(null);
  const [selectedRoom, setSelectedRoom] = useState(null);

  // Fetch rooms when on welcome screen
  const fetchRooms = useCallback(async () => {
    try {
      const res = await fetch(`${apiBase}/rooms`);
      if (!res.ok) throw new Error(`Error fetching rooms: ${res.status}`);
      const data = await res.json();
      setRooms(data);
    } catch (err) {
      console.error("Error fetching rooms:", err);
    }
  }, [apiBase]);

  useEffect(() => {
    if (screen === "welcome") fetchRooms();
  }, [screen, fetchRooms]);
  
  // Delete a room and refresh list
  const handleDeleteRoom = useCallback(async (roomId) => {
    if (!window.confirm('Delete this room?')) return;
    try {
      const res = await fetch(`${apiBase}/rooms/${roomId}`, { method: 'DELETE' });
      if (!res.ok) throw new Error(`Error deleting room: ${res.status}`);
      fetchRooms();
    } catch (err) {
      console.error('Error deleting room:', err);
    }
  }, [apiBase, fetchRooms]);

  // Fetch room details when entering a room
  const handleEnterRoom = useCallback(async (room) => {
    try {
      const response = await fetch(`${apiBase}/rooms/${room.id}`);
      if (!response.ok) throw new Error(`Error fetching room ${room.id}: ${response.status}`);
      const data = await response.json();
      // Ensure graph structure
      if (!data.graph) data.graph = { nodes: [], edges: [] };
      if (!Array.isArray(data.graph.nodes)) data.graph.nodes = [];
      if (!Array.isArray(data.graph.edges)) data.graph.edges = [];
      // build nodes list from backend-provided players and neutrals
      const nodes = [
        ...data.players.map(p => ({
          id: p.id,
          name: p.name,
          icon: p.icon,
          x: p.x_str,
          y: p.y_str,
          score: p.score,
          out_deg: p.out_deg,
          in_deg: p.in_deg
        })),
        ...data.neutrals.map(n => ({
          id: n.id,
          name: n.name,
          icon: n.icon,
          x: n.x_str,
          y: n.y_str,
          score: n.score,
          out_deg: n.out_deg,
          in_deg: n.in_deg
        }))
      ];
      setSelectedRoom({ ...data, mode: { player_id: null }, nodes });
      setScreen("lobby");
    } catch (err) {
      console.error(err);
      // fallback to welcome
      setScreen("welcome");
    }
  }, [apiBase]);

  // After selecting player in lobby, go to player screen
  const handleSelectPlayer = useCallback((playerId) => {
    const target = selectedRoom?.players?.find((p) => p.id === playerId);
    if (target?.is_ai) {
      window.alert('AI players are controlled by the computer. Please pick a human player.');
      return;
    }
    setSelectedRoom(prev => ({ ...prev, mode: { player_id: playerId } }));
    setScreen("player");
  }, [selectedRoom]);

  // After fetching room details when entering a room, we set selectedRoom and screen
  // Add a handler for renaming players
  const handleRenamePlayer = useCallback(async (playerId, newName) => {
    try {
      const url = `${apiBase}/rooms/${selectedRoom.id}/players/${playerId}/rename`;
      console.log('Calling rename endpoint with', { url, playerId, newName });
      const res = await fetch(
        url,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ new_name: newName }),
        }
      );
      if (!res.ok) {
        throw new Error(`Failed to rename player: ${res.status}`);
      }
      // Update local selectedRoom.players
      setSelectedRoom((prev) => {
        // update players array
        const updatedPlayers = prev.players.map((p) =>
          p.id === playerId ? { ...p, name: newName } : p
        );
        // update corresponding node names for player nodes
        const updatedNodes = prev.nodes.map((n) =>
          n.id === playerId ? { ...n, name: newName } : n
        );
        return { ...prev, players: updatedPlayers, nodes: updatedNodes };
      });
    } catch (err) {
      console.error('Error renaming player:', err);
      alert('Error renaming player: ' + err.message);
    }
  }, [apiBase, selectedRoom]);

  // Common: fetch updated room data and transition to given screen
  const transitionRoom = useCallback(async (targetScreen) => {
    try {
      const res = await fetch(`${apiBase}/rooms/${selectedRoom.id}`);
      if (!res.ok) throw new Error(`Error fetching room: ${res.status}`);
      const data = await res.json();
      // rebuild nodes from updated room data
      const nodes = [
        ...data.players.map(p => ({
          id: p.id, name: p.name, icon: p.icon, x: p.x_str, y: p.y_str, score: p.score,
          out_deg: p.out_deg, in_deg: p.in_deg
        })),
        ...data.neutrals.map(n => ({
          id: n.id, name: n.name, icon: n.icon, x: n.x_str, y: n.y_str, score: n.score,
          out_deg: n.out_deg, in_deg: n.in_deg
        }))
      ];
      setSelectedRoom({ ...data, mode: selectedRoom.mode, nodes });
    } catch (err) {
      console.error(`Error fetching room for ${targetScreen}:`, err);
    } finally {
      setScreen(targetScreen);
    }
  }, [apiBase, selectedRoom]);

  // After waiting for next turn or game over, fetch new data and navigate
  const handleNextTurn = useCallback(() => transitionRoom("player"), [transitionRoom]);
  const handleGameOver = useCallback(() => transitionRoom("trophy"), [transitionRoom]);

  return (
    <>
      {screen === "welcome" && (
        <Welcome 
          rooms={rooms}
          onEnterRoom={handleEnterRoom}
          onDeleteRoom={handleDeleteRoom}
          onCreateRoom={() => setScreen("new")}
        />
      )}
      {screen === "new" && (
        <NewRoom 
          onCreate={() => setScreen("welcome")}
          onReturn={() => setScreen("welcome")}
        />
      )}
      {screen === "lobby" && selectedRoom && (
        <RoomLobby 
          room={selectedRoom} 
          onStart={handleSelectPlayer}
          onGameOver={handleGameOver}
          onDeleteRoom={(id) => { handleDeleteRoom(id); setScreen("welcome"); }}
          onReturn={() => setScreen("welcome")}
          onRenamePlayer={handleRenamePlayer}
        />
      )}
      {screen === "player" && selectedRoom && (
        <Player
          room={selectedRoom}
          currentPlayerId={selectedRoom.mode.player_id}
          onEndTurn={(turnNumber) => { setLastTurnNumber(turnNumber); setScreen("waiting"); }}
          onReturn={() => setScreen("welcome")}
        />
      )}
      {screen === "waiting" && (
        <Waiting
          room={selectedRoom}
          currentPlayerId={selectedRoom.mode.player_id}
          onNextTurn={handleNextTurn}
          onGameOver={handleGameOver}
          onReturn={() => setScreen("welcome")}
          turnNumber={lastTurnNumber}
        />
      )}
      {screen === "trophy" && selectedRoom && (
        <Trophy
          room={selectedRoom}
          onRestart={() => {
            setScreen("welcome");
            setSelectedRoom(null);
          }}
        />
      )}
    </>
  );
}
