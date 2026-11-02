import { useI18n } from "./i18n/useI18n.js";
import {
  lazy,
  Suspense,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import Home from "./screens/Home.jsx";
import Icon from "./components/Icon.jsx";
import { api, writeStorage } from "./utils/api.js";
import { PRESETS, presetPayload } from "./utils/presets.js";
const RoomForm = lazy(() => import("./components/RoomForm.jsx"));
const Laboratory = lazy(() => import("./screens/Laboratory.jsx"));
const Guide = lazy(() => import("./screens/Guide.jsx"));
const GameRoom = lazy(() => import("./screens/GameRoom.jsx"));
const currentRoute = () => window.location.hash.slice(1) || "home";
export default function GameApp() {
  const { t, language, setLanguage } = useI18n();
  const [route, setRoute] = useState(currentRoute);
  const [rooms, setRooms] = useState([]);
  const [status, setStatus] = useState("connecting");
  const [preset, setPreset] = useState("solo");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const warmed = useRef(false);
  const fetching = useRef(false);
  const creating = useRef(false);
  const main = useRef(null);
  const refresh = useCallback(async () => {
    if (fetching.current) return;
    fetching.current = true;
    setStatus((previous) => (previous === "online" ? "online" : "connecting"));
    try {
      const data = await api("/rooms");
      setRooms(data);
      setStatus("online");
      if (!warmed.current) {
        warmed.current = true;
        api("/rooms", {
          body: {
            name: "__warmup__",
          },
        }).catch(() => {
          warmed.current = false;
        });
      }
    } catch {
      setStatus("offline");
    } finally {
      fetching.current = false;
    }
  }, []);
  useEffect(() => {
    refresh();
  }, [refresh]);
  useEffect(() => {
    const onChange = () => {
      setRoute(currentRoute());
      setError("");
      window.scrollTo({
        top: 0,
        behavior: "instant",
      });
      main.current?.focus({
        preventScroll: true,
      });
    };
    window.addEventListener("hashchange", onChange);
    return () => window.removeEventListener("hashchange", onChange);
  }, []);
  useEffect(() => {
    if (route !== "home") return;
    refresh();
    const timer = setInterval(() => {
      if (document.visibilityState === "visible") refresh();
    }, 20000);
    return () => clearInterval(timer);
  }, [route, refresh]);
  const create = async (settings, quick = false) => {
    if (creating.current) return;
    creating.current = true;
    setBusy(true);
    setError("");
    try {
      const room = await api("/rooms", {
        body: settings,
      });
      if (quick) {
        const result = await api(`/rooms/${room.id}/join`, {
          body: {
            player_id: room.players.find((player) => !player.is_ai).id,
          },
        });
        writeStorage(`session:${room.id}`, {
          player_id: result.player_id,
          token: result.token,
        });
      }
      setRooms((current) => [room, ...current]);
      window.location.hash = `room/${room.id}`;
    } catch (err) {
      setError(
        err.status
          ? err.message
          : "サーバーにつながりませんでした。少し待って再試行してください。実験室は接続なしで使えます。",
      );
    } finally {
      creating.current = false;
      setBusy(false);
    }
  };
  const roomId =
    route.startsWith("room/") && /^[a-zA-Z0-9-]+$/.test(route.slice(5))
      ? route.slice(5)
      : null;
  return (
    <>
      <a
        href="#main"
        className="skip-link"
        onClick={(event) => {
          event.preventDefault();
          main.current?.focus();
        }}
      >
        {t("本文へ移動")}
      </a>
      <header className="site-header">
        <div className="header-inner">
          <a
            href="#home"
            className="brand"
            aria-label={t("Markovian Town ホーム")}
          >
            <span className="brand-mark">
              <svg
                width="30"
                height="30"
                viewBox="0 0 30 30"
                aria-hidden="true"
              >
                <path
                  d="m7 21 8-14 8 14ZM7 21h16"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  fill="none"
                />
                <circle cx="15" cy="7" r="4" fill="#d1ec9c" />
                <circle cx="7" cy="21" r="4" fill="#e98e63" />
                <circle cx="23" cy="21" r="4" fill="#f4f3e8" />
              </svg>
            </span>
            <span>
              Markovian
              <span className="brand-town">
                Town<span className="brand-dot">.</span>
              </span>
            </span>
          </a>
          <nav className="main-nav" aria-label={t("メインメニュー")}>
            <a
              className={
                route === "home" || route === "new" || roomId ? "active" : ""
              }
              href="#home"
            >
              <Icon name="play" size={16} />
              <span>{t("遊ぶ")}</span>
            </a>
            <a className={route === "lab" ? "active" : ""} href="#lab">
              <Icon name="lab" size={17} />
              <span>{t("実験室")}</span>
            </a>
            <a className={route === "guide" ? "active" : ""} href="#guide">
              <Icon name="book" size={17} />
              <span>{t("学ぶ")}</span>
            </a>
          </nav>
          <div className="language-switch" role="group" aria-label={t("言語")}>
            <button
              type="button"
              lang="ja"
              aria-pressed={language === "ja"}
              onClick={() => setLanguage("ja")}
            >
              日本語
            </button>
            <button
              type="button"
              lang="en"
              aria-pressed={language === "en"}
              onClick={() => setLanguage("en")}
            >
              English
            </button>
          </div>
        </div>
      </header>
      <main id="main" ref={main} tabIndex={-1}>
        {error && (
          <div className="page global-error">
            <div className="error-banner" role="alert">
              <span>{t(error)}</span>
              <button
                className="icon-button"
                aria-label={t("エラーを閉じる")}
                onClick={() => setError("")}
              >
                <Icon name="close" size={16} />
              </button>
            </div>
          </div>
        )}
        <Suspense
          fallback={
            <div className="page loading-page" role="status">
              <div className="loading-orbit" />
              {t("画面を準備しています…")}
            </div>
          }
        >
          {roomId ? (
            <GameRoom key={roomId} id={roomId} />
          ) : route === "new" ? (
            <RoomForm
              key={preset}
              presetId={preset}
              busy={busy}
              onCreate={create}
            />
          ) : route === "lab" ? (
            <Laboratory />
          ) : route === "guide" ? (
            <Guide />
          ) : (
            <Home
              rooms={rooms}
              serverStatus={status}
              refresh={refresh}
              busy={busy}
              onPreset={(id) => {
                setPreset(id);
                window.location.hash = "new";
              }}
              onQuickStart={() =>
                create(presetPayload(PRESETS[0], t("はじめての街")), true)
              }
            />
          )}
        </Suspense>
      </main>
      <footer className="site-footer">
        <a href="#home">Markovian Town.</a>
        <span>{t("つながりの中に、数学を見つけよう。")}</span>
        <a
          href="https://github.com/shizuo-kaji/markov-game"
          target="_blank"
          rel="noreferrer"
        >
          About / GitHub ↗
        </a>
      </footer>
    </>
  );
}
