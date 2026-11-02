import { useCallback, useEffect, useRef, useState } from "react";
import { api, API_BASE } from "../utils/api.js";

export default function useRoom(id) {
  const [room, setRoom] = useState(null);
  const [removed, setRemoved] = useState(false);
  const unavailable = useRef(false);
  const [connection, setConnection] = useState("connecting");
  const [error, setError] = useState("");
  const updateRoom = useCallback((next) => {
    if (unavailable.current) return;
    setRoom((previous) =>
      !previous || previous.id !== next.id || next.revision >= previous.revision
        ? next
        : previous,
    );
    setError("");
  }, []);
  const forgetRoom = useCallback((message) => {
    unavailable.current = true;
    setRoom(null);
    setRemoved(true);
    setConnection("offline");
    setError(message);
  }, []);
  useEffect(() => {
    if (!id || removed) return;
    let active = true,
      socket,
      reconnect,
      heartbeat,
      failures = 0,
      refreshing = false,
      lastMessage = Date.now();
    const controller = new AbortController();
    const gone = (message) => {
      active = false;
      forgetRoom(message);
    };
    const refresh = async () => {
      if (refreshing || !active) return;
      refreshing = true;
      try {
        const next = await api(`/rooms/${id}`, {
          signal: AbortSignal.any([
            controller.signal,
            AbortSignal.timeout(20000),
          ]),
        });
        if (active) updateRoom(next);
      } catch (err) {
        if (active) {
          if (err.status === 404) gone(err.message);
          else
            setError(
              "接続を確認しています。操作内容はこの端末に保存されています。",
            );
        }
      } finally {
        refreshing = false;
      }
    };
    const connect = () => {
      if (!active) return;
      socket = new WebSocket(`${API_BASE.replace(/^http/, "ws")}/ws/${id}`);
      socket.onopen = () => {
        if (active) {
          setConnection("online");
          failures = 0;
          lastMessage = Date.now();
        }
      };
      socket.onmessage = (event) => {
        if (!active) return;
        lastMessage = Date.now();
        try {
          const message = JSON.parse(event.data);
          if (message.type === "room") updateRoom(message.room);
          if (message.type === "room_deleted")
            gone(
              message.reason === "expired"
                ? "無操作時間が過ぎたため、このルームは削除されました。"
                : "作成者がこのルームを削除しました。",
            );
        } catch {
          /* Ignore malformed network frames. */
        }
      };
      socket.onerror = () => socket.close();
      socket.onclose = (event) => {
        clearInterval(heartbeat);
        if (!active) return;
        setConnection("reconnecting");
        if (event.code === 4004) {
          gone(
            "このルームは見つかりません。ホームから新しく作成してください。",
          );
          return;
        }
        reconnect = setTimeout(
          connect,
          Math.min(10000, 1000 * 2 ** failures++),
        );
      };
      heartbeat = setInterval(() => {
        if (socket.readyState !== WebSocket.OPEN) return;
        if (Date.now() - lastMessage > 45000) socket.close();
        else socket.send("ping");
      }, 20000);
    };
    refresh();
    connect();
    const fallback = setInterval(() => {
      if (
        document.visibilityState === "visible" &&
        socket?.readyState !== WebSocket.OPEN
      )
        refresh();
    }, 10000);
    const onVisible = () => {
      if (document.visibilityState === "visible") refresh();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      active = false;
      controller.abort();
      clearInterval(fallback);
      clearInterval(heartbeat);
      clearTimeout(reconnect);
      socket?.close();
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [id, updateRoom, removed, forgetRoom]);
  return {
    room: room?.id === id ? room : null,
    updateRoom,
    connection,
    error,
    removed,
    forgetRoom,
  };
}
