from fastapi import FastAPI, HTTPException, WebSocket, WebSocketDisconnect
from pydantic import BaseModel, Field
from typing import List, Dict, Any
import uuid
import numpy as np
from fastapi.middleware.cors import CORSMiddleware

import os

app = FastAPI()

# Add CORS middleware
frontend_url = os.environ.get("FRONTEND_URL", "*") # Default to * for local development
app.add_middleware(
    CORSMiddleware,
    allow_origins=[frontend_url],  # Allows specific origin from environment variable
    allow_credentials=True,
    allow_methods=["*"],  # Allows all methods
    allow_headers=["*"],  # Allows all headers
)

# --- WebSocket Connections ---
connections: Dict[str, List[WebSocket]] = {}

async def broadcast_message(room_id: str, message: Dict[str, Any]):
    if room_id in connections:
        # Create a copy of the list to avoid issues with concurrent modification
        # if a client disconnects during iteration
        for connection in list(connections[room_id]):
            try:
                await connection.send_json(message)
            except RuntimeError: # Client disconnected
                connections[room_id].remove(connection)
                if not connections[room_id]:
                    del connections[room_id]

# --- Models ---

class Player(BaseModel):
    id: str
    name: str
    score: float = 0.0

class Move(BaseModel):
    id: int = None # Add id for DB
    player_id: str
    source: str
    target: str
    weight_change: int

class Room(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str

    num_players_N: int = 1  # Default to 1 player
    num_non_player_nodes_M: int = 2 # Default to 2 non-player nodes
    points_per_round_K: int = 10 # Default to 10 points per round
    max_turns_S: int = 10 # Default to 10 turns
    players: List[Player] = []
    
    
    graph: Dict[str, Any] = {"nodes": [], "edges": []}
    moves: List[Move] = []
    turn: int = 1
    submitted_moves_points: Dict[str, int] = {}

# --- In-memory database ---
rooms: Dict[str, Room] = {}

# --- Helper Functions ---

def get_room_safe(room_id: str) -> Room:
    if room_id not in rooms:
        raise HTTPException(status_code=404, detail="Room not found")
    return rooms[room_id]

# --- API Endpoints ---

@app.get("/")
def read_root():
    return {"message": "Welcome to the Markov Chain Game API"}

class RoomCreate(BaseModel):
    name: str

    num_players_N: int = 2
    num_non_player_nodes_M: int = 2
    points_per_round_K: int = 10
    max_turns_S: int = 10


@app.post("/rooms", response_model=Room, status_code=201)
def create_room(room_data: RoomCreate):
    new_room = Room(
        name=room_data.name,
        num_players_N=room_data.num_players_N,
        num_non_player_nodes_M=room_data.num_non_player_nodes_M,
        points_per_round_K=room_data.points_per_round_K,
        max_turns_S=room_data.max_turns_S
    )

    player_nodes = [f"Player-{i+1}" for i in range(new_room.num_players_N)]
    other_nodes = [f"neutral_{i+1}" for i in range(new_room.num_non_player_nodes_M)]
    nodes = player_nodes + other_nodes

    # Simple symmetric graph generation for initial setup
    # This can be made more sophisticated later
    edges = []
    # Connect all player nodes to each other
    for i in range(len(player_nodes)):
        for j in range(i + 1, len(player_nodes)):
            edges.append({"source": player_nodes[i], "target": player_nodes[j], "weight": 1.0})
            edges.append({"source": player_nodes[j], "target": player_nodes[i], "weight": 1.0}) # Add reverse edge
    
    # Connect player nodes to non-player nodes
    for p_node in player_nodes:
        for o_node in other_nodes:
            edges.append({"source": p_node, "target": o_node, "weight": 1.0})
            edges.append({"source": o_node, "target": p_node, "weight": 1.0}) # Add reverse edge

    # Connect non-player nodes to each other (optional, for more complex graphs)
    for i in range(len(other_nodes)):
        for j in range(i + 1, len(other_nodes)):
            edges.append({"source": other_nodes[i], "target": other_nodes[j], "weight": 1.0})
            edges.append({"source": other_nodes[j], "target": other_nodes[i], "weight": 1.0}) # Add reverse edge

    new_room.graph = {
        "nodes": [{"id": n} for n in nodes],
        "edges": edges
    }

    # Add players to the room
    for i in range(new_room.num_players_N):
        player_id = str(uuid.uuid4())
        player_name = f"Player-{i+1}"
        new_room.players.append(Player(id=player_id, name=player_name))

    rooms[new_room.id] = new_room
    return new_room

@app.get("/rooms", response_model=List[Room])
def get_rooms():
    return list(rooms.values())



@app.get("/rooms/{room_id}", response_model=Room)
def get_room(room_id: str):
    room = get_room_safe(room_id)
    print("Returning room from get_room:", room.dict()) # Add this line for debugging
    return room

@app.post("/rooms/{room_id}/moves", response_model=Move)
async def submit_move(room_id: str, move: Move):
    room = get_room_safe(room_id);

    player_ids = {p.id for p in room.players}
    if move.player_id not in player_ids:
        raise HTTPException(status_code=404, detail="Player not found in this room")

    points_spent = abs(move.weight_change)
    current_points_spent = room.submitted_moves_points.get(move.player_id, 0);

    if current_points_spent + points_spent > room.points_per_round_K:
        raise HTTPException(status_code=400, detail=f"Player {move.player_id} has exceeded their points limit for this round. Remaining: {room.points_per_round_K}")

    room.submitted_moves_points[move.player_id] = current_points_spent + points_spent
    room.moves.append(move)

    await broadcast_message(room_id, {"type": "move_submitted", "room": room.dict()}) # Broadcast updated room
    return move

@app.post("/rooms/{room_id}/calculate-scores", response_model=Room)
async def calculate_scores(room_id: str):
    room = get_room_safe(room_id)

    # 1. Consolidate and apply moves to the graph
    consolidated_moves: Dict[tuple[str, str], int] = {}
    for move in room.moves:
        edge_key = (move.source, move.target)
        consolidated_moves[edge_key] = consolidated_moves.get(edge_key, 0) + move.weight_change

    print(f"Applying consolidated moves: {consolidated_moves}")
    for edge in room.graph["edges"]:
        edge_key = (edge["source"], edge["target"])
        if edge_key in consolidated_moves:
            net_change = consolidated_moves[edge_key]
            new_weight = int(edge["weight"] + net_change)
            edge["weight"] = max(0, new_weight)
    print("Graph after moves:", room.graph)

    # 2. Create transition matrix
    node_ids = [node["id"] for node in room.graph["nodes"]]
    node_index = {name: i for i, name in enumerate(node_ids)}
    matrix_size = len(node_ids)
    adj_matrix = np.zeros((matrix_size, matrix_size))

    for edge in room.graph["edges"]:
        u, v = node_index[edge["source"]], node_index[edge["target"]]
        # Adjacency matrix構築時に、重みが0の場合は0.1に置き換える
        weight = max(0.1, float(edge["weight"])) # ここで0.1を加える
        adj_matrix[u, v] = weight
    print("Adjacency Matrix:\n", adj_matrix)

    # Normalize to get transition matrix
    row_sums = adj_matrix.sum(axis=1, keepdims=True)
    print("Row Sums:\n", row_sums)
    # Avoid division by zero for isolated nodes
    row_sums[row_sums == 0] = 1
    transition_matrix = adj_matrix / row_sums
    print("Transition Matrix:\n", transition_matrix)

    # 3. Calculate stationary distribution (eigenvector for eigenvalue 1)
    eigenvalues, eigenvectors = np.linalg.eig(transition_matrix.T)
    print("Eigenvalues:\n", eigenvalues)
    print("Eigenvectors:\n", eigenvectors)
    stationary_vector = None
    for i, eigenvalue in enumerate(eigenvalues):
        if np.isclose(eigenvalue, 1):
            stationary_vector = np.real(eigenvectors[:, i])
            break

    if stationary_vector is None:
        raise HTTPException(status_code=500, detail="Could not find stationary distribution")

    stationary_distribution = stationary_vector / stationary_vector.sum()
    print("Stationary Distribution:\n", stationary_distribution)

    # 4. Update player scores
    for player in room.players:
        if player.name in node_index:
            player.score = stationary_distribution[node_index[player.name]]
            print(f"Player {player.name} ({player.id}) score updated to: {player.score}")

    # 5. Reset for next turn
    room.moves = []
    room.turn += 1
    room.submitted_moves_points = {}

    # Ensure graph nodes and edges are lists before broadcasting
    if "nodes" not in room.graph or not isinstance(room.graph["nodes"], list):
        room.graph["nodes"] = []
    if "edges" not in room.graph or not isinstance(room.graph["edges"], list):
        room.graph["edges"] = []

    if room.turn > room.max_turns_S: # Game over condition
        # Sort players by score for ranking
        ranked_players = sorted(room.players, key=lambda p: p.score, reverse=True)
        game_over_message = {
            "type": "game_over",
            "room": room.dict(),
            "ranking": [{"id": p.id, "name": p.name, "score": p.score} for p in ranked_players]
        }
        await broadcast_message(room_id, game_over_message)
        del rooms[room_id] # Remove room from in-memory storage
    else:
        await broadcast_message(room_id, {"type": "scores_calculated", "room": room.dict()})
    return room

@app.post("/rooms/{room_id}/reset-turn", response_model=Room)
async def reset_turn(room_id: str):
    room = get_room_safe(room_id)

    # Reset moves and points for the current turn
    room.moves = []
    room.submitted_moves_points = {}

    print(f"Turn reset for room {room_id}")

    # Broadcast the reset state to all clients in the room
    await broadcast_message(room_id, {"type": "turn_reset", "room": room.dict()})

    return room

@app.delete("/rooms/{room_id}", status_code=204)
async def delete_room(room_id: str):
    if room_id not in rooms:
        raise HTTPException(status_code=404, detail="Room not found")
    
    # Notify clients in the room that it's being deleted
    await broadcast_message(room_id, {"type": "room_deleted", "detail": "This room has been deleted by the host."})
    
    # Clean up connections
    if room_id in connections:
        for connection in connections[room_id]:
            await connection.close(code=1000) # Normal closure
        del connections[room_id]
        
    # Delete the room
    del rooms[room_id]
    return



@app.websocket("/ws/{room_id}")
async def websocket_endpoint(websocket: WebSocket, room_id: str):
    # Ensure room exists
    get_room_safe(room_id)

    await websocket.accept()
    if room_id not in connections:
        connections[room_id] = []
    connections[room_id].append(websocket)
    try:
        while True:
            # Keep connection alive, or handle messages if needed
            # For now, we just expect the client to send nothing
            await websocket.receive_text()
    except WebSocketDisconnect:
        connections[room_id].remove(websocket)
        if not connections[room_id]:
            del connections[room_id]