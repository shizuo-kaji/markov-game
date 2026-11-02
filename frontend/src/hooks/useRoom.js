import { useCallback, useEffect, useState } from "react";
import { api, API_BASE } from "../utils/api.js";

export default function useRoom(id) {
  const [room, setRoom] = useState(null);
  const [connection, setConnection] = useState("connecting");
  const [error, setError] = useState("");
  const updateRoom = useCallback((next) => {
    setRoom((previous) =>
      !previous || previous.id !== next.id || next.revision >= previous.revision
        ? next
        : previous,
    );
    setError("");
  }, []);
  useEffect(() => {
    if (!id) return;
    let active = true,
      socket,
      reconnect,
      heartbeat,
      failures = 0,
      refreshing = false,
      lastMessage = Date.now();
    const controller = new AbortController();
    const refresh = async () => {
      if (refreshing) return;
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
        if (active)
          setError(
            err.status === 404
              ? err.message
              : "接続を確認しています。操作内容はこの端末に保存されています。",
          );
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
          setError(
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
  }, [id, updateRoom]);
  return { room: room?.id === id ? room : null, updateRoom, connection, error };
}
