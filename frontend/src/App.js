import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Network } from 'vis-network';
import { DataSet } from 'vis-data';
import './App.css';

//const API_BASE_URL = 'http://localhost:8000';
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

function App() {
  const [rooms, setRooms] = useState([]);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [newRoomName, setNewRoomName] = useState('Test Room');
  const [newRoomPlayersN, setNewRoomPlayersN] = useState(4);
  const [newRoomNonPlayerNodesM, setNewRoomNonPlayerNodesM] = useState(1);
  const [newRoomPointsK, setNewRoomPointsK] = useState(5);
  const [newRoomMaxTurnsS, setNewRoomMaxTurnsS] = useState(3);

  const fetchRooms = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/rooms`);
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const data = await response.json();
      setRooms(data);
    } catch (error) {
      console.error("Error fetching rooms:", error);
    }
  }, []);

  useEffect(() => {
    fetchRooms();
  }, [fetchRooms]);

  const handleCreateRoom = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`${API_BASE_URL}/rooms`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newRoomName,
          num_players_N: newRoomPlayersN,
          num_non_player_nodes_M: newRoomNonPlayerNodesM,
          points_per_round_K: newRoomPointsK,
          max_turns_S: newRoomMaxTurnsS
        })
      });
      if (response.ok) {
        setNewRoomName('');
        fetchRooms();
      } else {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to create room.');
      }
    } catch (error) {
      console.error("Error creating room:", error);
      alert("Error creating room: " + error.message);
    }
  };

  const handleDeleteRoom = async (roomId) => {
    if (window.confirm('Are you sure you want to delete this room?')) {
      try {
        const response = await fetch(`${API_BASE_URL}/rooms/${roomId}`, {
          method: 'DELETE',
        });
        if (response.ok) {
          fetchRooms(); // Refresh the room list
        } else {
          const errorData = await response.json();
          throw new Error(errorData.detail || 'Failed to delete room.');
        }
      } catch (error) {
        console.error('Error deleting room:', error);
        alert('Error deleting room: ' + error.message);
      }
    }
  };

  const [selectedPlayerId, setSelectedPlayerId] = useState('');

  const handleSelectRoom = (room, playerId) => {
    if (!playerId) {
      alert('Please select a player to join as.');
      return;
    }
    fetch(`${API_BASE_URL}/rooms/${room.id}`)
      .then(res => {
        if (!res.ok) {
          throw new Error(`Room not found or error fetching room. Status: ${res.status}`);
        }
        return res.json();
      })
      .then(data => {
        if (!data.graph) {
          data.graph = { nodes: [], edges: [] };
        } else {
          if (!Array.isArray(data.graph.nodes)) {
            data.graph.nodes = [];
          }
          if (!Array.isArray(data.graph.edges)) {
            data.graph.edges = [];
          }
        }
        setSelectedRoom({ ...data, mode: { player_id: playerId } });
        console.log("Selected Room Data:", { ...data, mode: { player_id: playerId } });
      })
      .catch(err => {
        console.error("Error fetching room details:", err);
        alert("Failed to join the room. It might have been deleted. Returning to the lobby.");
        fetchRooms();
        setSelectedRoom(null);
      });
  };

  if (selectedRoom) {
    return <GameRoom room={selectedRoom} setRoom={setSelectedRoom} onBack={() => {
      setSelectedRoom(null);
    }} mode={selectedRoom.mode} />;
  }

  return (
    <div className="App">
      <header className="App-header">
        <h1>Markov Chain Game</h1>
        <div className="room-manager">
          <div className="room-list">
            <h2>Available Rooms</h2>
            {rooms.length === 0 ? <p>No rooms available. Create one!</p> : (
              <ul>
                {rooms.map(room => (
                  <li key={room.id}>
                    {room.name} - <span>{room.description}</span>
                    <span> ({room.num_players_N} players)</span>
                    <select onChange={(e) => setSelectedPlayerId(e.target.value)} defaultValue="">
                      <option value="" disabled>Select Player</option>
                      {Array.from({ length: room.num_players_N }, (_, i) => (
                        <option key={`Player-${i+1}`} value={i}>Player-{i+1}</option>
                      ))}
                    </select>
                    <button onClick={() => handleSelectRoom(room, selectedPlayerId)}>Join</button>
                    <button onClick={() => handleDeleteRoom(room.id)} className="delete-button">Delete</button>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div className="create-room">
            <h2>Create New Room</h2>
            <form onSubmit={handleCreateRoom}>
              <div>
                <label>Room Name:</label>
                <input
                  type="text"
                  placeholder="Room Name"
                  value={newRoomName}
                  onChange={(e) => setNewRoomName(e.target.value)}
                  required
                />
              </div>

              <div>
                <label>Number of Players:</label>
                <input
                  type="number"
                  placeholder="Players (N)"
                  value={newRoomPlayersN}
                  onChange={(e) => setNewRoomPlayersN(parseInt(e.target.value, 10))}
                  min="1"
                  required
                />
              </div>
              <div>
                <label>Number of Non-Player Nodes:</label>
                <input
                  type="number"
                  placeholder="Non-Player Nodes (M)"
                  value={newRoomNonPlayerNodesM}
                  onChange={(e) => setNewRoomNonPlayerNodesM(parseInt(e.target.value, 10))}
                  min="0"
                  required
                />
              </div>
              <div>
                <label>Points per Round:</label>
                <input
                  type="number"
                  placeholder="Points per Round (K)"
                  value={newRoomPointsK}
                  onChange={(e) => setNewRoomPointsK(parseInt(e.target.value, 10))}
                  min="1"
                  required
                />
              </div>
              <div>
                <label>Max Turns:</label>
                <input
                  type="number"
                  placeholder="Max Turns (S)"
                  value={newRoomMaxTurnsS}
                  onChange={(e) => setNewRoomMaxTurnsS(parseInt(e.target.value, 10))}
                  min="1"
                  required
                />
              </div>
              <button type="submit">Create</button>
            </form>
          </div>
        </div>
      </header>
    </div>
  );
}

function GameRoom({ room, setRoom, onBack, mode }) {
  const player_id = mode?.player_id || room.player_id || '';
  const selected_player = room?.players?.[player_id]?.name || ''
  const movePlayerId = room?.players?.[player_id]?.id || (room.players && room.players.length > 0 ? room.players[0].id : '');
  const [moveSource, setMoveSource] = useState(room.graph.nodes && room.graph.nodes.length > 0 ? room.graph.nodes[0].id : '');
  const [moveTarget, setMoveTarget] = useState(room.graph.nodes && room.graph.nodes.length > 1 ? room.graph.nodes[1].id : '');
  const [moveWeight, setMoveWeight] = useState(1);

  const networkRef = useRef(null); // Add this ref
  const visNetwork = useRef(null); // vis-network インスタンスを保持するためのref
  const nodesDataSet = useRef(null);
  const edgesDataSet = useRef(null);

  // Effect for initializing and updating the network.
  useEffect(() => {
    if (networkRef.current && room.graph) {
      // If the network instance doesn't exist, create it.
      if (!visNetwork.current) {
        // Arrange nodes in a circle for initial layout.
        const radius = room.graph.nodes.length * 40;
        const nodesWithPositions = room.graph.nodes.map((node, index) => {
          const angle = (index / room.graph.nodes.length) * 2 * Math.PI;
          return {
            id: node.id,
            label: String(node.id),
            x: radius * Math.cos(angle),
            y: radius * Math.sin(angle),
          };
        });

        nodesDataSet.current = new DataSet(nodesWithPositions);
        edgesDataSet.current = new DataSet(room.graph.edges.map(edge => ({ from: edge.source, to: edge.target, label: String(edge.weight) })));

        const data = {
          nodes: nodesDataSet.current,
          edges: edgesDataSet.current,
        };

        const options = {
          physics: {
            enabled: false,
          },
          edges: {
            arrows: 'to',
            smooth: {
              enabled: true,
              type: "curvedCW",
              roundness: 0.15
            }
          },
        };

        visNetwork.current = new Network(networkRef.current, data, options);

        // Fit the view after the initial layout.
        setTimeout(() => {
            if (visNetwork.current) {
                visNetwork.current.fit();
            }
        }, 100);
      } else {
        // If the network instance already exists, just update the data.
        // Update nodes without changing their positions.
        const newNodes = room.graph.nodes.map(node => {
          const existingNode = nodesDataSet.current.get(node.id);
          return { ...(existingNode || {}), id: node.id, label: String(node.id) };
        });
        nodesDataSet.current.update(newNodes);

        // Update edges.
        const newEdges = room.graph.edges.map(edge => ({
          id: `${edge.source}-${edge.target}`,
          from: edge.source,
          to: edge.target,
          label: String(edge.weight)
        }));

        const edgeIds = edgesDataSet.current.getIds();
        edgesDataSet.current.remove(edgeIds);
        edgesDataSet.current.add(newEdges);
      }
    }
  }, [room.graph]); // This effect depends on room.graph for updates.

  // This effect is ONLY for cleaning up the network when the component unmounts.
  useEffect(() => {
    return () => {
      if (visNetwork.current) {
        visNetwork.current.destroy();
        visNetwork.current = null;
      }
    };
  }, []); // Empty dependency array means this runs only on unmount.

  // WebSocket connection
  useEffect(() => {
    const ws = new WebSocket(`${API_BASE_URL.replace('http', 'ws')}/ws/${room.id}`);

    ws.onopen = () => {
      console.log('WebSocket connected');
    };

    ws.onmessage = (event) => {
      const message = JSON.parse(event.data);
      console.log('Received message:', message);

      if (message.type === 'move_submitted') {
        // Update only the submitted moves points, not the entire room object
        setRoom(prevRoom => ({
          ...prevRoom,
          submitted_moves_points: message.room.submitted_moves_points
        }));
      } else if (message.type === 'scores_calculated') {
        setRoom({ ...message.room }); // Update room state with new scores and graph
        alert('Scores calculated and turn advanced!');
      } else if (message.type === 'player_joined' || message.type === 'game_start') {
        setRoom(message.room); // Update room state when player joins or game starts
        if (message.type === 'game_start') {
          alert('All players joined! Game started!');
        }
      } else if (message.type === 'turn_reset') {
        setRoom(message.room);
        alert('The turn has been reset.');
      } else if (message.type === 'game_over') {
        const rankingText = message.ranking
          .map((p, index) => `${index + 1}: ${p.name} (Score: ${p.score.toFixed(4)})`)
          .join('\n');
        alert(`Game Over!\n\nFinal Rankings:\n${rankingText}`);
      }
    };

    ws.onclose = () => {
      console.log('WebSocket disconnected');
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    return () => {
      ws.close();
    };
  }, [room.id, setRoom]); // Reconnect if room.id changes



  const handleSubmitMove = async (e) => {
    e.preventDefault();
    const moveData = {
      player_id: movePlayerId, // Use movePlayerId directly
      source: moveSource,
      target: moveTarget,
      weight_change: parseInt(moveWeight, 10),
    };

    try {
      const response = await fetch(`${API_BASE_URL}/rooms/${room.id}/moves`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(moveData),
      });
      if (response.ok) {
        // const submittedMove = await response.json();
        // alert(`Move submitted: ${submittedMove.player_id} changed ${submittedMove.source}-${submittedMove.target} by ${submittedMove.weight_change}`);
        // Optionally, update the room state to show submitted moves
      } else {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to submit move.');
      }
    } catch (error) {
      console.error("Error submitting move:", error);
      alert("Error: " + error.message);
    }
  };

  const handleCalculateScores = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/rooms/${room.id}/calculate-scores`, {
        method: 'POST',
      });
      if (response.ok) {
        const updatedRoom = await response.json();
        setRoom(updatedRoom); // Update the room state in the parent component
        // alert('Scores calculated and turn advanced!');
      } else {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to calculate scores.');
      }
    } catch (error) {
      console.error("Error calculating scores:", error);
      alert("Error: " + error.message);
    }
  };

  const handleResetTurn = async () => {
    if (window.confirm('Are you sure you want to reset the current turn? All submitted moves in this turn will be lost.')) {
      try {
        const response = await fetch(`${API_BASE_URL}/rooms/${room.id}/reset-turn`, {
          method: 'POST',
        });
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.detail || 'Failed to reset turn.');
        }
      } catch (error) {
        console.error("Error resetting turn:", error);
        alert("Error: " + error.message);
      }
    }
  };

  return (
    <div className="App">
       <header className="App-header">
        <button onClick={onBack} style={{position: 'absolute', top: 10, left: 10}}>Back to Lobby</button>
        <h2>{room.name}</h2>
        <div className="game-layout">
            <div id="mynetwork" ref={networkRef} className="graph-container"></div>
            <div className="control-panel">
                <h3>Turn: {room.turn} / {room.max_turns_S}</h3>
                <h3>Players</h3>
                <table className="players-table">
                    <thead>
                        <tr>
                            <th>Player</th>
                            <th>Score</th>
                            <th>Points</th>
                        </tr>
                    </thead>
                    <tbody>
                        {room.players && room.players.map(p => {
                            const pointsSpent = room.submitted_moves_points[p.id] || 0;
                            const remainingPoints = room.points_per_round_K - pointsSpent;
                            return (
                                <tr key={p.id}>
                                    <td>{p.name}</td>
                                    <td>{p.score.toFixed(4)}</td>
                                    <td>{remainingPoints}/{room.points_per_round_K}</td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
                <div className="move-submission">
                    <h3>Submit Move for {selected_player || 'No player selected'}</h3>
                    <form onSubmit={handleSubmitMove}>
                        <label>Source:</label>
                        <select value={moveSource} onChange={e => setMoveSource(e.target.value)}>
                            {room.graph.nodes && room.graph.nodes.map(n => <option key={n.id} value={n.id}>{n.id}</option>)}
                        </select>
                        <label>Target:</label>
                        <select value={moveTarget} onChange={e => setMoveTarget(e.target.value)}>
                            {room.graph.nodes && room.graph.nodes.map(n => <option key={n.id} value={n.id}>{n.id}</option>)}
                        </select>
                        <label>Weight Change:</label>
                        <input type="number" value={moveWeight} onChange={e => setMoveWeight(e.target.value)} />
                        <button type="submit">Submit Move</button>
                    </form>
                </div>
                <div className="calculate-scores-button-container">
                    <button onClick={handleCalculateScores} className="calculate-scores-button">
                        Calculate Scores & Next Turn
                    </button>
                    <button onClick={handleResetTurn} className="reset-turn-button">
                        Reset Turn
                    </button>
                </div>
            </div>
        </div>
      </header>
    </div>
  );
}

export default App;
