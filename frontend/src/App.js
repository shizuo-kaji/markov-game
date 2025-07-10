import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Network } from 'vis-network';
import { DataSet } from 'vis-data';
import './App.css';

//const API_BASE_URL = 'http://localhost:8000';
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

function App() {
  const [rooms, setRooms] = useState([]);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [newRoomName, setNewRoomName] = useState('');
  const [newRoomPlayersN, setNewRoomPlayersN] = useState(2);
  const [newRoomNonPlayerNodesM, setNewRoomNonPlayerNodesM] = useState(2);
  const [newRoomPointsK, setNewRoomPointsK] = useState(10);
  const [newRoomMaxTurnsS, setNewRoomMaxTurnsS] = useState(10);

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

  const handleSelectRoom = (room) => {
    fetch(`${API_BASE_URL}/rooms/${room.id}`)
      .then(res => res.json())
      .then(data => {
        // Ensure data.graph exists and has nodes/edges properties
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
        setSelectedRoom({ ...data }); // Pass mode along with room data
        console.log("Selected Room Data:", { ...data }); // Add this line
      })
      .catch(err => console.error("Error fetching room details:", err));
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
                    <span> ({room.current_players_count}/{room.num_players_N} players)</span>
                    <button onClick={() => handleSelectRoom(room)}>Join</button>
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
                <label>Number of Players (N):</label>
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
                <label>Number of Non-Player Nodes (M):</label>
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
                <label>Points per Round (K):</label>
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
                <label>Max Turns (S):</label>
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

function GameRoom({ room, setRoom, onBack }) {
  const [movePlayerId, setMovePlayerId] = useState(room.players && room.players.length > 0 ? room.players[0].id : '');
  const [moveSource, setMoveSource] = useState(room.graph.nodes && room.graph.nodes.length > 0 ? room.graph.nodes[0].id : '');
  const [moveTarget, setMoveTarget] = useState(room.graph.nodes && room.graph.nodes.length > 1 ? room.graph.nodes[1].id : '');
  const [moveWeight, setMoveWeight] = useState(1);

  const networkRef = useRef(null); // Add this ref
  const visNetwork = useRef(null); // vis-network インスタンスを保持するためのref
  const nodesDataSet = useRef(null);
  const edgesDataSet = useRef(null);

  useEffect(() => {
    if (networkRef.current && room.graph) {
      if (!visNetwork.current) {
        nodesDataSet.current = new DataSet(room.graph.nodes.map(node => ({ id: node.id, label: String(node.id) })));
        edgesDataSet.current = new DataSet(room.graph.edges.map(edge => ({ from: edge.source, to: edge.target, label: String(edge.weight) })));

        const data = {
          nodes: nodesDataSet.current,
          edges: edgesDataSet.current,
        };

        const options = {
          physics: {
            enabled: false, // Disable physics simulation
            stabilization: {
              enabled: false // 安定化を無効にする
            }
          },
          edges: {
            arrows: 'to',
            smooth: {
              enabled: true,
              type: "curvedCW", // エッジを曲線で表示
              roundness: 0.15 // カーブの度合いを調整
            }
          },
        };
        visNetwork.current = new Network(networkRef.current, data, options);
      }
    }

    return () => {
      if (visNetwork.current) {
        visNetwork.current.destroy();
        visNetwork.current = null;
      }
    };
  }, []); // Empty dependency array to run only once on mount

  useEffect(() => {
    if (nodesDataSet.current && edgesDataSet.current && room.graph) {
      // Update nodes
      const newNodes = room.graph.nodes.map(node => ({ id: node.id, label: String(node.id) }));
      nodesDataSet.current.update(newNodes);

      // Update edges
      const newEdges = room.graph.edges.map(edge => ({
        id: `${edge.source}-${edge.target}`,
        from: edge.source,
        to: edge.target,
        label: String(edge.weight)
      }));
      edgesDataSet.current.update(newEdges);
    }
  }, [room.graph]); // Update data when room.graph changes

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
        setRoom({ ...message.room }); // Update room state with new submitted_moves_points
      } else if (message.type === 'scores_calculated') {
        setRoom({ ...message.room }); // Update room state with new scores and graph
        alert('Scores calculated and turn advanced!');
      } else if (message.type === 'player_joined' || message.type === 'game_start') {
        setRoom(message.room); // Update room state when player joins or game starts
        if (message.type === 'game_start') {
          alert('All players joined! Game started!');
        }
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
        const submittedMove = await response.json();
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

  return (
    <div className="App">
       <header className="App-header">
        <button onClick={onBack} style={{position: 'absolute', top: 10, left: 10}}>Back to Lobby</button>
        <h2>{room.name}</h2>
        <p>Players: {room.players.length} / {room.num_players_N}</p>

        <div className="game-layout">
            <div id="mynetwork" ref={networkRef} className="graph-container"></div>
            <div className="control-panel">
                <h3>Turn: {room.turn} / {room.max_turns_S}</h3>
                <h3>Players</h3>
                <ul>
                    {room.players && room.players.map(p => {
                        const pointsSpent = room.submitted_moves_points[p.id] || 0;
                        const remainingPoints = room.points_per_round_K - pointsSpent;
                        return (
                            <li key={p.id}>
                                {p.name} (Score: {p.score.toFixed(4)}) (Points: {remainingPoints}/{room.points_per_round_K})
                            </li>
                        );
                    })}
                </ul>
                <div className="move-submission">
                    <h3>Submit Move</h3>
                    <form onSubmit={handleSubmitMove}>
                        <label>Player:</label>
                        <select value={movePlayerId} onChange={e => setMovePlayerId(e.target.value)}>
                            {room.players && room.players.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                        </select>
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
                </div>
            </div>
        </div>
      </header>
    </div>
  );
}

export default App;
