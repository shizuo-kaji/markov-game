import { localizeRoom } from "../i18n/core.js";
import { useI18n } from "../i18n/useI18n.js";
import { useEffect, useMemo, useRef, useState } from "react";
import useRoom from "../hooks/useRoom.js";
import FlowLab from "../components/FlowLab.jsx";
import NetworkBoard from "../components/NetworkBoard.jsx";
import EdgeEditor from "../components/EdgeEditor.jsx";
import Icon from "../components/Icon.jsx";
import { api, readStorage, writeStorage } from "../utils/api.js";
import { applyMoves, COLORS, percent, signed } from "../utils/markov.js";
function Scoreboard({ room, playerId }) {
  const { t } = useI18n();
  return (
    <div className="scoreboard">
      {room.players.map((player) => {
        const index = room.nodes.findIndex((node) => node.id === player.id);
        const previous =
          room.history.length > 1
            ? room.history.at(-2).scores[index]
            : room.scores[index];
        const change = (room.scores[index] - previous) * 100;
        return (
          <div
            key={player.id}
            className={`score-card ${player.id === playerId ? "my-score" : ""}`}
            style={{
              "--player-color": COLORS[index],
            }}
          >
            <div>
              <span className="player-dot" />
              {player.name}
              <small>
                {player.id === playerId
                  ? t("あなた")
                  : player.is_ai
                    ? "AI"
                    : "PLAYER"}
              </small>
            </div>
            <strong>{percent(room.scores[index])}</strong>
            <span className={change >= 0 ? "positive" : "negative"}>
              {signed(Number(change.toFixed(1)))} %pt
            </span>
          </div>
        );
      })}
    </div>
  );
}
function ShareRoom({ room }) {
  const { t } = useI18n();
  const [copied, setCopied] = useState(false);
  const link = `${window.location.origin}${window.location.pathname}#room/${room.id}`;
  return (
    <div className="share-room">
      <label className="field">
        {t("同じ街で遊ぶ人に、このリンクを共有")}
        <div className="share-input">
          <input
            value={link}
            readOnly
            aria-label={t("ルームの共有リンク")}
            onFocus={(e) => e.target.select()}
          />
          <button
            className="button small"
            onClick={async () => {
              try {
                await navigator.clipboard.writeText(link);
                setCopied(true);
              } catch {
                setCopied(false);
              }
            }}
          >
            <Icon name={copied ? "check" : "link"} size={17} />
            {copied ? t("コピー済み") : t("コピー")}
          </button>
        </div>
      </label>
    </div>
  );
}
function Lobby({ room, session, onJoin, onSpectate }) {
  const { t } = useI18n();
  const available = room.players.find(
    (player) =>
      !player.is_ai && (!player.claimed || player.id === session?.player_id),
  );
  const [selected, setSelected] = useState(available?.id || "");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const target = room.players.find((player) => player.id === selected);
  const join = async () => {
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      await onJoin(selected, name);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };
  return (
    <>
      <div className="page-heading">
        <div>
          <span className="eyebrow">WELCOME TO YOUR TOWN</span>
          <h1>{room.name}</h1>
          <p className="lead">
            {t("あなたのお店を選んで、街の流れを変えよう。")}
          </p>
        </div>
        <span className="pill">
          {t("{0}pt × {1}ラウンド", [
            room.settings.points_per_round_K,
            room.settings.max_turns_S,
          ])}
        </span>
      </div>
      <div className="game-layout">
        <section className="board-card lobby-board">
          <div className="board-heading">
            <div>
              <span className="eyebrow">YOUR STARTING MAP</span>
              <h2>{t("この街で、どんな流れを作る？")}</h2>
            </div>
          </div>
          <NetworkBoard
            nodes={room.nodes}
            matrix={room.matrix}
            transition={room.transition}
            distribution={room.scores}
          />
          <div className="lobby-rules">
            <div>
              <span>01</span>
              <strong>{t("辺の重みを変える")}</strong>
            </div>
            <div>
              <span>02</span>
              <strong>{t("全員で同時に反映")}</strong>
            </div>
            <div>
              <span>03</span>
              <strong>{t("最後の割合で勝負")}</strong>
            </div>
          </div>
          <p className="fine-print">
            {t(
              "得点は定常分布でのあなたのお店の割合。最初から全ての点の合計は100%です。",
            )}
          </p>
        </section>
        <aside className="editor-panel">
          <span className="eyebrow">CHOOSE YOUR PLACE</span>
          <h2>{t("どのお店で参加する？")}</h2>
          <div className="seat-list">
            {room.players.map((player, i) => (
              <button
                className={`seat ${selected === player.id ? "selected" : ""}`}
                key={player.id}
                disabled={
                  busy ||
                  player.is_ai ||
                  (player.claimed && player.id !== session?.player_id)
                }
                onClick={() => setSelected(player.id)}
              >
                <span
                  className="seat-number"
                  style={{
                    background: COLORS[i],
                  }}
                >
                  {i + 1}
                </span>
                <span>
                  <strong>{player.name}</strong>
                  <small>
                    {player.is_ai
                      ? t("コンピューターが担当")
                      : player.claimed
                        ? t("参加済み")
                        : t("参加できます")}
                  </small>
                </span>
                {selected === player.id && <Icon name="check" size={19} />}
              </button>
            ))}
          </div>
          <label className="field">
            {t("あなたの名前（任意）")}
            <input
              value={name}
              maxLength={24}
              placeholder={t("そのままでもOK")}
              disabled={busy}
              onChange={(e) => setName(e.target.value)}
            />
          </label>
          {error && (
            <p className="error-text" role="alert">
              {t(error)}
            </p>
          )}
          <button
            className="button primary full"
            disabled={
              busy ||
              !target ||
              (target.claimed && target.id !== session?.player_id)
            }
            onClick={join}
          >
            {busy ? t("参加しています…") : t("このお店で参加する")}
            <Icon name="arrow" />
          </button>
          <button className="button full" onClick={onSpectate}>
            {t("観戦する")}
          </button>
          <div className="callout">
            <Icon name="book" size={18} />
            <p>
              {t(
                "1回の増減に1ポイント。使い切らずに提出してもOK。全員が提出すると流れが変わります。",
              )}
            </p>
          </div>
        </aside>
      </div>
      <ShareRoom room={room} />
    </>
  );
}
function RoundEditor({ room, session, updateRoom }) {
  const { t } = useI18n();
  const key = `draft:${room.id}:${room.round}:${session.player_id}`;
  const [moves, setMoves] = useState(() => readStorage(key, []));
  const [selection, setSelection] = useState({
    source:
      room.nodes.find((node) => node.kind === "neutral")?.id ||
      room.nodes[0].id,
    target: session.player_id,
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [preview, setPreview] = useState(false);
  const inFlight = useRef(false);
  const receipt = useRef(readStorage(`${key}:receipt`));
  const projected = useMemo(
    () => applyMoves(room.matrix, room.nodes, moves),
    [room.matrix, room.nodes, moves],
  );
  const spent = moves.reduce((sum, move) => sum + Math.abs(move.delta), 0);
  const budget = room.settings.points_per_round_K;
  useEffect(() => {
    writeStorage(key, moves);
  }, [key, moves]);
  const change = (source, target, delta) => {
    if (busy) return;
    if (!source) {
      setMoves([]);
      return;
    }
    setMoves((current) => [
      ...current.filter(
        (move) => move.source !== source || move.target !== target,
      ),
      ...(delta
        ? [
            {
              source,
              target,
              delta,
            },
          ]
        : []),
    ]);
  };
  const submit = async () => {
    if (inFlight.current) return;
    inFlight.current = true;
    setBusy(true);
    setError("");
    const fingerprint = JSON.stringify(moves);
    if (receipt.current?.fingerprint !== fingerprint) {
      receipt.current = {
        fingerprint,
        id: crypto.randomUUID(),
      };
      writeStorage(`${key}:receipt`, receipt.current);
    }
    try {
      const next = await api(`/rooms/${room.id}/submit`, {
        token: session.token,
        body: {
          round: room.round,
          request_id: receipt.current.id,
          moves,
        },
      });
      updateRoom(next);
      writeStorage(key, []);
    } catch (err) {
      setError(
        err.status
          ? err.message
          : "送信結果を確認できませんでした。再提出しても二重送信にはなりません。",
      );
      if (err.status === 409) {
        try {
          updateRoom(await api(`/rooms/${room.id}`));
        } catch {
          /* Retry remains available. */
        }
      }
    } finally {
      inFlight.current = false;
      setBusy(false);
    }
  };
  return (
    <div className="game-layout">
      <div className="play-board-column">
        <FlowLab
          key={preview ? JSON.stringify(projected) : "actual"}
          nodes={room.nodes}
          matrix={preview ? projected : room.matrix}
          selection={selection}
          onSelect={setSelection}
          title={preview ? t("自分の変更だけを試す仮の街") : t("いまの街")}
        />
        <label className="preview-toggle">
          <input
            type="checkbox"
            checked={preview}
            onChange={(e) => setPreview(e.target.checked)}
          />
          {t("自分の変更だけを盤面でプレビュー")}
          <span>{t("相手の手は含みません")}</span>
        </label>
      </div>
      <aside className="editor-panel">
        <div className="editor-heading">
          <span className="eyebrow">YOUR NEXT MOVE</span>
          <h2>{t("次の流れをつくろう")}</h2>
          <p>
            {t("入ってくる道？ 出ていく道？ 小さな変更が、街全体に響きます。")}
          </p>
        </div>
        <div className="budget">
          <span>{t("使えるポイント")}</span>
          <strong>
            {budget - spent}
            <small> / {budget}</small>
          </strong>
          <div className="budget-dots">
            {Array.from(
              {
                length: budget,
              },
              (_, i) => (
                <i key={i} className={i < budget - spent ? "available" : ""} />
              ),
            )}
          </div>
        </div>
        <EdgeEditor
          nodes={room.nodes}
          matrix={room.matrix}
          selection={selection}
          onSelect={setSelection}
          moves={moves}
          onChange={change}
          budget={budget}
          disabled={busy}
        />
        {error && (
          <p role="alert" className="error-text">
            {t(error)}
          </p>
        )}
        <button
          className="button primary full submit-button"
          disabled={busy}
          onClick={submit}
        >
          {busy
            ? t("提出しています…")
            : moves.length
              ? t("この変更で提出する")
              : t("変更せずに提出する")}
          <Icon name="check" size={18} />
        </button>
        <p className="fine-print">
          {t("提出後は変更できません。")}
          {budget - spent > 0
            ? t("残り{0}ポイントは持ち越されません。", [budget - spent])
            : ""}
          {t("全員の提出後に同時に反映します。")}
        </p>
        <ReadyList room={room} playerId={session.player_id} />
      </aside>
    </div>
  );
}
function ReadyList({ room, playerId }) {
  const { t } = useI18n();
  return (
    <div className="ready-list">
      <h3>{t("みんなの準備")}</h3>
      {room.players.map((player) => (
        <div key={player.id}>
          <span>
            {player.name}
            {player.id === playerId ? t("（あなた）") : ""}
          </span>
          <span
            className={`pill ${player.is_ai || room.submitted.includes(player.id) ? "success" : ""}`}
          >
            {player.is_ai
              ? "AI"
              : room.submitted.includes(player.id)
                ? t("提出済み")
                : player.claimed
                  ? t("考え中")
                  : t("未参加")}
          </span>
        </div>
      ))}
    </div>
  );
}
function HistoryChart({ room }) {
  const { t } = useI18n();
  return (
    <section className="panel history-panel">
      <div className="section-heading">
        <h2>{t("作戦のあとを、たどってみよう。")}</h2>
        <span className="pill">{t("得点の推移")}</span>
      </div>
      <div className="history-chart">
        <svg
          viewBox="0 0 650 210"
          role="img"
          aria-label={t("各プレイヤーのラウンドごとの定常分布の得点")}
        >
          <g fill="#708174" fontSize="12">
            {[0, 0.25, 0.5, 0.75, 1].map((value) => (
              <g key={value}>
                <text x="0" y={174 - value * 150}>
                  {Math.round(value * 100)}%
                </text>
                <path d={`M38 ${170 - value * 150}H630`} stroke="#e4e8df" />
              </g>
            ))}
          </g>
          {room.players.map((player, i) => (
            <polyline
              key={player.id}
              points={room.history
                .map(
                  (entry, j) =>
                    `${38 + (j / Math.max(1, room.history.length - 1)) * 592},${170 - entry.scores[i] * 150}`,
                )
                .join(" ")}
              fill="none"
              stroke={COLORS[i]}
              strokeWidth="3"
            />
          ))}
          {room.history.map((entry, i) => (
            <text
              key={entry.round}
              x={38 + (i / Math.max(1, room.history.length - 1)) * 592}
              y="198"
              textAnchor="middle"
              fontSize="11"
              fill="#708174"
            >
              {entry.round === 0 ? t("開始") : `R${entry.round}`}
            </text>
          ))}
        </svg>
      </div>
      <div className="chart-legend">
        {room.players.map((player, i) => (
          <span key={player.id}>
            <i
              style={{
                background: COLORS[i],
              }}
            />
            {player.name}
          </span>
        ))}
      </div>
      <details>
        <summary>{t("ラウンドごとの数値を見る")}</summary>
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>{t("ラウンド")}</th>
                {room.players.map((p) => (
                  <th key={p.id}>{p.name}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {room.history.map((entry) => (
                <tr key={entry.round}>
                  <th>{entry.round}</th>
                  {room.players.map((p, i) => (
                    <td key={p.id}>{percent(entry.scores[i])}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </section>
  );
}
function Review({ room, round, onContinue }) {
  const { t } = useI18n();
  const entry =
    room.history.find((item) => item.round === round) || room.history.at(-1);
  const previous =
    room.history.find((item) => item.round === entry.round - 1) || entry;
  const [selection, setSelection] = useState(
    entry.changes[0] || {
      source: room.nodes[0].id,
      target: room.nodes[1].id,
    },
  );
  return (
    <>
      <div className="review-banner">
        <span className="feature-icon">
          <Icon name="chart" />
        </span>
        <div>
          <span className="eyebrow">
            ROUND {entry.round} / OBSERVE & REFLECT
          </span>
          <h1>{t("道が変わった。人の流れは？")}</h1>
          <p>
            {t(
              "変更を見て、再生で確かめよう。準備ができるまで、ゆっくり観察できます。",
            )}
          </p>
        </div>
        <button className="button primary" onClick={onContinue}>
          {room.status === "finished" ? t("結果を見る") : t("次の操作へ")}
          <Icon name="arrow" />
        </button>
      </div>
      <div className="game-layout">
        <FlowLab
          key={entry.round}
          nodes={room.nodes}
          matrix={entry.matrix}
          changes={entry.changes}
          selection={selection}
          onSelect={setSelection}
          autoPlay
          title={t("ラウンド {0} の街", [entry.round])}
        />
        <aside className="editor-panel">
          <span className="eyebrow">WHAT CHANGED?</span>
          <h2>{t("みんなの手の結果")}</h2>
          <div className="changes-list">
            {entry.changes.length ? (
              entry.changes.map((change) => (
                <button
                  key={`${change.source}-${change.target}`}
                  onClick={() => setSelection(change)}
                  className={
                    selection.source === change.source &&
                    selection.target === change.target
                      ? "selected-change"
                      : ""
                  }
                >
                  <span>
                    {room.nodes.find((node) => node.id === change.source)?.name}
                    <Icon name="arrow" size={13} />
                    {room.nodes.find((node) => node.id === change.target)?.name}
                  </span>
                  <strong>
                    {change.before} → {change.after}
                    <b className={change.delta >= 0 ? "positive" : "negative"}>
                      {signed(change.delta)}
                    </b>
                  </strong>
                  {change.delta !== change.requested_delta && (
                    <small>
                      {t("合計 {0}。重みの下限0で調整。", [
                        signed(change.requested_delta),
                      ])}
                    </small>
                  )}
                </button>
              ))
            ) : (
              <p className="muted">{t("辺の重みに変化はありませんでした。")}</p>
            )}
          </div>
          <h3>{t("得点はどう変わった？")}</h3>
          <div className="review-scores">
            {room.players.map((player) => {
              const i = room.nodes.findIndex((node) => node.id === player.id);
              const delta = (entry.scores[i] - previous.scores[i]) * 100;
              return (
                <div key={player.id}>
                  <span>{player.name}</span>
                  <strong>{percent(entry.scores[i])}</strong>
                  <small className={delta >= 0 ? "positive" : "negative"}>
                    {signed(Number(delta.toFixed(1)))} %pt
                  </small>
                </div>
              );
            })}
          </div>
          <p className="fine-print">
            {t(
              "%pt は得点の割合の差（パーセントポイント）。重みを変えるためのポイントとは別です。",
            )}
          </p>
          <details>
            <summary>{t("全員の提出した手を見る")}</summary>
            {entry.moves.map((move, i) => (
              <p className="fine-print" key={i}>
                {
                  room.players.find((player) => player.id === move.player_id)
                    ?.name
                }
                : {room.nodes.find((n) => n.id === move.source)?.name} →{" "}
                {room.nodes.find((n) => n.id === move.target)?.name}{" "}
                {signed(move.delta)}
              </p>
            ))}
          </details>
          <div className="callout">
            <Icon name="book" size={18} />
            <p>
              <strong>{t("振り返ってみよう")}</strong>
              <br />
              {t(
                "予想と合っていた？ 人が集まっている場所からの道は、どれくらい効いただろう？",
              )}
            </p>
          </div>
          <button className="button primary full" onClick={onContinue}>
            {room.status === "finished" ? t("結果を見る") : t("次の操作へ")}
            <Icon name="arrow" size={18} />
          </button>
        </aside>
      </div>
    </>
  );
}
function Results({ room, exportRoom, onReview }) {
  const { t } = useI18n();
  const ranking = room.players
    .map((player) => ({
      ...player,
      score: room.scores[room.nodes.findIndex((node) => node.id === player.id)],
    }))
    .sort((a, b) => b.score - a.score);
  const winners = ranking.filter(
    (player) => Math.abs(player.score - ranking[0].score) < 1e-9,
  );
  const download = () => {
    const blob = new Blob(
      [
        JSON.stringify(
          {
            schema_version: 2,
            ...exportRoom,
          },
          null,
          2,
        ),
      ],
      {
        type: "application/json",
      },
    );
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `markov-town-${room.id}.json`;
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };
  return (
    <>
      <div className="result-hero">
        <span className="result-icon">
          <Icon name="spark" size={38} />
        </span>
        <span className="eyebrow">EVERY MOVE TELLS A STORY</span>
        <h1>
          {winners.length > 1
            ? t("一緒に、いちばん人気の店へ。")
            : t("{0}が、いちばん人気の店に。", [winners[0].name])}
        </h1>
        <p>
          {t("{0}ラウンド、おつかれさまでした。最後の街の流れを振り返ろう。", [
            room.settings.max_turns_S,
          ])}
        </p>
      </div>
      <div className="ranking-list">
        {ranking.map((player, i) => (
          <div className="ranking-row" key={player.id}>
            <span className="rank">
              {ranking.filter((p) => p.score > player.score + 1e-9).length + 1}
            </span>
            <strong>{player.name}</strong>
            <span>{player.is_ai ? "AI" : "PLAYER"}</span>
            <div className="ranking-bar">
              <i
                style={{
                  width: `${player.score * 100}%`,
                  background:
                    COLORS[
                      room.nodes.findIndex((node) => node.id === player.id)
                    ],
                }}
              />
            </div>
            <b>{percent(player.score)}</b>
            {i === 0 && <Icon name="spark" />}
          </div>
        ))}
      </div>
      <p className="fine-print centered">
        {t(
          "最終ラウンドの定常分布で順位を計算しています。公共施設の割合も含めた合計が100%です。",
        )}
      </p>
      <HistoryChart room={room} />
      <div className="result-actions">
        <a href="#new" className="button primary">
          {t("もう一度、新しい街で")}
          <Icon name="arrow" />
        </a>
        <button className="button" onClick={onReview}>
          <Icon name="play" />
          {t("最後の流れを再生")}
        </button>
        <button className="button" onClick={download}>
          <Icon name="download" />
          {t("結果を保存（JSON）")}
        </button>
        <a className="button" href="#lab">
          {t("実験室で続きを試す")}
        </a>
      </div>
      <div className="callout">
        <Icon name="book" />
        <p>
          <strong>{t("得点の大きさだけでなく、作戦の理由も。")}</strong>
          <br />
          {t(
            "どの変更が効いた？ ほかのプレイヤーの変更で予想が変わった？ グラフを見ながら説明してみよう。",
          )}
        </p>
      </div>
    </>
  );
}
export default function GameRoom({ id }) {
  const { t } = useI18n();
  const { room: rawRoom, updateRoom, connection, error } = useRoom(id);
  const room = useMemo(() => localizeRoom(rawRoom, t), [rawRoom, t]);
  const [session, setSession] = useState(() => readStorage(`session:${id}`));
  const [spectating, setSpectating] = useState(false);
  const [seenRound, setSeenRound] = useState(() =>
    readStorage(`seen:${id}`, 0),
  );
  const [historyRound, setHistoryRound] = useState(null);
  const join = async (playerId, name) => {
    const result = await api(`/rooms/${id}/join`, {
      token: session?.token,
      body: {
        player_id: playerId,
        ...(name.trim()
          ? {
              name: name.trim(),
            }
          : {}),
      },
    });
    const next = {
      token: result.token,
      player_id: result.player_id,
    };
    writeStorage(`session:${id}`, next);
    setSession(next);
    updateRoom(result.room);
  };
  const latestRound = room?.history.at(-1).round || 0;
  const reviewing =
    historyRound ??
    ((session || spectating) && latestRound > seenRound ? latestRound : null);
  const inLobby = room && !session && !spectating && room.status !== "finished";
  const waiting = room && session && room.submitted.includes(session.player_id);
  const viewId = !room
    ? "loading"
    : inLobby
      ? "lobby"
      : reviewing !== null
        ? `review-${reviewing}`
        : room.status === "finished"
          ? "results"
          : `round-${room.round}-${waiting ? "waiting" : "playing"}`;
  useEffect(() => {
    if (viewId === "loading") return;
    window.scrollTo({
      top: 0,
      behavior: "instant",
    });
    document.getElementById("main")?.focus({
      preventScroll: true,
    });
  }, [viewId]);
  if (!room)
    return (
      <div className="page loading-page">
        <div className="loading-orbit" />
        <h1>{error ? t("接続を確認してください") : t("街を開いています…")}</h1>
        <p role="status">
          {t(error) || t("サーバーの起動には1分ほどかかる場合があります。")}
        </p>
        <a className="button" href="#home">
          {t("ホームに戻る")}
        </a>
      </div>
    );
  const continueGame = () => {
    setSeenRound(latestRound);
    writeStorage(`seen:${id}`, latestRound);
    setHistoryRound(null);
  };
  return (
    <div className="page game-page">
      <div className="room-toolbar">
        <a className="back-link" href="#home">
          <Icon name="back" size={16} />
          {t("ホーム")}
        </a>
        <span className="room-title">{room.name}</span>
        <span className="connection-label">
          <span
            className={`status-dot ${connection === "online" ? "online" : "connecting"}`}
          />
          {connection === "online" ? t("ライブ接続") : t("再接続中")}
        </span>
        {latestRound > 0 && (
          <label className="history-select">
            {t("振り返り")}{" "}
            <select
              value={historyRound ?? ""}
              onChange={(e) =>
                setHistoryRound(e.target.value ? Number(e.target.value) : null)
              }
            >
              <option value="">{t("ラウンドを選択")}</option>
              {room.history
                .filter((entry) => entry.round > 0)
                .map((entry) => (
                  <option value={entry.round} key={entry.round}>
                    {t("ラウンド {0}", [entry.round])}
                  </option>
                ))}
            </select>
          </label>
        )}
      </div>
      {error && (
        <div className="error-banner" role="alert">
          {t(error)}
        </div>
      )}
      {inLobby ? (
        <Lobby
          room={room}
          session={session}
          onJoin={join}
          onSpectate={() => setSpectating(true)}
        />
      ) : reviewing !== null ? (
        <Review
          key={reviewing}
          room={room}
          round={reviewing}
          onContinue={continueGame}
        />
      ) : room.status === "finished" ? (
        <Results
          room={room}
          exportRoom={rawRoom}
          onReview={() => setHistoryRound(latestRound)}
        />
      ) : (
        <>
          <div className="page-heading game-heading">
            <div>
              <span className="eyebrow">
                {spectating
                  ? "WATCH THE TOWN"
                  : waiting
                    ? "MOVES SEALED"
                    : "PLAN · CHANGE · OBSERVE"}
              </span>
              <h1>
                {spectating
                  ? t("街の変化を観戦中")
                  : waiting
                    ? t("提出完了。みんなの手を待とう。")
                    : t("あなたの一手で、流れが変わる。")}
              </h1>
            </div>
            <div className="round-counter">
              <span>ROUND</span>
              <strong>
                {room.round}
                <small> / {room.settings.max_turns_S}</small>
              </strong>
            </div>
          </div>
          <Scoreboard room={room} playerId={session?.player_id} />
          {session && !waiting ? (
            <RoundEditor
              key={`${id}:${room.round}`}
              room={room}
              session={session}
              updateRoom={updateRoom}
            />
          ) : (
            <div className="game-layout">
              <FlowLab
                key={room.round}
                nodes={room.nodes}
                matrix={room.matrix}
                title={t("現在の街を観察")}
              />
              <aside className="editor-panel">
                <span className="eyebrow">
                  {waiting ? "READY WHEN EVERYONE IS" : "SPECTATOR VIEW"}
                </span>
                <h2>
                  {waiting
                    ? t("みんなが提出すると、次へ。")
                    : t("作戦を予想してみよう。")}
                </h2>
                <p className="muted">
                  {t(
                    "全員の手が揃ったら、自動で新しい街を表示します。観察画面は自分のペースで進められます。",
                  )}
                </p>
                <ReadyList room={room} playerId={session?.player_id} />
                <div className="callout">
                  <Icon name="spark" />
                  <p>
                    {t(
                      "同じ重みでも、出発点に人が多いほど大きな流れになります。どの道が重要そう？",
                    )}
                  </p>
                </div>
                <ShareRoom room={room} />
                {spectating && (
                  <button
                    className="button full"
                    onClick={() => setSpectating(false)}
                  >
                    {t("参加する席を選ぶ")}
                  </button>
                )}
              </aside>
            </div>
          )}
        </>
      )}
    </div>
  );
}
