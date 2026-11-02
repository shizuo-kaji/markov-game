import { localizeNodes } from "../i18n/core.js";
import { useI18n } from "../i18n/useI18n.js";
import { useMemo, useState } from "react";
import NetworkBoard from "../components/NetworkBoard.jsx";
import Icon from "../components/Icon.jsx";
import DeleteRoom from "../components/DeleteRoom.jsx";
import { PRESETS, LAB_NODES } from "../utils/presets.js";
import {
  initialMatrix,
  buildTransitionMatrix,
  stationaryDistribution,
} from "../utils/markov.js";
export default function Home({
  rooms,
  serverStatus,
  refresh,
  onPreset,
  onQuickStart,
  busy,
}) {
  const { t } = useI18n();
  const nodes = useMemo(() => localizeNodes(LAB_NODES, t), [t]);
  const [search, setSearch] = useState("");
  const matrix = useMemo(() => {
    const next = initialMatrix();
    next[2][0] += 3;
    return next;
  }, []);
  const transition = useMemo(() => buildTransitionMatrix(matrix), [matrix]);
  const status = {
    connecting: "Waking up server...",
    online: "Server online",
    offline: "Server offline",
  };
  return (
    <div className="page home-page">
      <section className="hero">
        <div className="hero-copy">
          <span className="eyebrow">
            <span className="tiny-line" /> A LITTLE TOWN. A BIG IDEA.
          </span>
          <h1>
            {t("人の流れを変える。")}
            <br />
            {t("街の未来が変わる。")}
          </h1>
          <p className="hero-description">
            {t("道の重みを変えて、あなたのお店に人を集めよう。")}
            <br className="desktop-only" />{" "}
            {t("遊びながら見えてくる、マルコフ連鎖とPageRankの世界。")}
          </p>
          <div className="hero-actions">
            <button
              className="button primary"
              disabled={busy || serverStatus !== "online"}
              onClick={onQuickStart}
            >
              {busy ? t("街を準備しています…") : t("1人で遊んでみる")}
              <Icon name="arrow" />
            </button>
            <a className="button text-button" href="#lab">
              {t("まずは自由に実験")}
              <Icon name="lab" />
            </a>
          </div>
          <p className="hero-caption">
            {t("予備知識は不要。必要なのは「どうなる？」という好奇心。")}
          </p>
          <div className="server-state" role="status">
            <span className={`status-dot ${serverStatus}`} />
            <span>{status[serverStatus]}</span>
            {serverStatus === "offline" && (
              <button onClick={refresh} className="text-link">
                {t("再接続")}
              </button>
            )}
            {serverStatus === "connecting" && (
              <span className="muted">
                {t("初回は1分ほどかかる場合があります")}
              </span>
            )}
          </div>
        </div>
        <div className="hero-visual">
          <div className="visual-label">
            <span className="pill light">A TOWN IN MOTION</span>
            <span className="mono">01 / EXPLORE</span>
          </div>
          <NetworkBoard
            compact
            nodes={nodes}
            matrix={matrix}
            transition={transition}
            distribution={stationaryDistribution(transition)}
            selection={{
              source: "n1",
              target: "p1",
            }}
          />
          <div className="visual-note">
            <span className="note-icon">
              <Icon name="spark" />
            </span>
            <div>
              <strong>{t("道をひとつ変えると、街全体が変わる。")}</strong>
              <span>{t("重み +3 → あなたのお店に集まる割合は？")}</span>
            </div>
          </div>
        </div>
      </section>
      <section className="start-section">
        <div className="section-heading">
          <div>
            <span className="eyebrow">CHOOSE YOUR WAY TO PLAY</span>
            <h2>{t("小さな街から、はじめよう。")}</h2>
          </div>
          <a className="text-link" href="#guide">
            {t("遊び方を読む")}
            <Icon name="arrow" size={16} />
          </a>
        </div>
        <div className="play-cards">
          {PRESETS.map((preset, i) => (
            <button
              className="play-card"
              key={preset.id}
              onClick={() => onPreset(preset.id)}
            >
              <div className="card-top">
                <span className={`feature-icon feature-${i}`}>
                  <Icon name={["play", "people", "book"][i]} size={22} />
                </span>
                <span className="pill">{t(preset.tag)}</span>
              </div>
              <h3>{t(preset.title)}</h3>
              <p>{t(preset.description)}</p>
              <div className="card-bottom">
                <span>
                  {t("{0}人 · {1}pt · {2}ラウンド", [
                    preset.n,
                    preset.k,
                    preset.s,
                  ])}
                </span>
                <Icon name="arrow" size={18} />
              </div>
            </button>
          ))}
        </div>
      </section>
      <section className="rooms-section">
        <div className="section-heading">
          <div>
            <span className="eyebrow">MEET IN THE SAME TOWN</span>
            <h2>{t("ルームに参加する")}</h2>
          </div>
          <button
            className="button small"
            onClick={refresh}
            disabled={serverStatus === "connecting"}
          >
            <Icon name="reset" size={16} />
            {t("更新")}
          </button>
        </div>
        <div className="room-search">
          <input
            aria-label={t("ルーム名で検索")}
            placeholder={t("ルーム名で探す…")}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <a className="button small" href="#new">
            <Icon name="plus" size={16} />
            {t("カスタム作成")}
          </a>
        </div>
        <div className="room-list">
          {rooms
            .filter((room) => room.name.includes(search))
            .map((room) => (
              <div className="room-list-item" key={room.id}>
                <a className="room-row" href={`#room/${room.id}`}>
                  <span className="room-symbol">
                    <Icon name="people" />
                  </span>
                  <div>
                    <strong>{room.name}</strong>
                    <span>
                      {t("{0}人 · 中立{1} · {2}pt / ラウンド", [
                        room.settings.num_players_N,
                        room.settings.num_non_player_nodes_M,
                        room.settings.points_per_round_K,
                      ])}
                    </span>
                  </div>
                  <span className="pill">
                    {room.status === "finished"
                      ? t("結果を見る")
                      : t("ラウンド {0} / {1}", [
                          room.round,
                          room.settings.max_turns_S,
                        ])}
                  </span>
                  <Icon name="arrow" size={18} />
                </a>
                <DeleteRoom room={room} onDeleted={refresh} />
              </div>
            ))}
          {!rooms.filter((room) => room.name.includes(search)).length && (
            <div className="empty-state">
              <Icon name="people" size={26} />
              <p>
                {search
                  ? t("一致するルームがありません。")
                  : serverStatus === "connecting"
                    ? t("サーバーにつないでいます。実験室はすぐに使えます。")
                    : t("まだルームがありません。新しい街を作ってみましょう。")}
              </p>
            </div>
          )}
        </div>
      </section>
      <div className="home-bottom">
        <span>CHANGE A WEIGHT. FOLLOW THE FLOW. FIND THE PATTERN.</span>
        <a href="#guide">
          {t("先生・ファシリテーターの方へ")}
          <Icon name="arrow" size={16} />
        </a>
      </div>
    </div>
  );
}
