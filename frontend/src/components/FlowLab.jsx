import { useI18n } from "../i18n/useI18n.js";
import { useEffect, useMemo, useState } from "react";
import NetworkBoard from "./NetworkBoard.jsx";
import Icon from "./Icon.jsx";
import {
  buildTransitionMatrix,
  stationaryDistribution,
  stepDistribution,
  uniform,
  totalVariation,
  sampleDestination,
  percent,
  COLORS,
} from "../utils/markov.js";
const makeWalkers = (n, start, stationary) =>
  Array.from(
    {
      length: 80,
    },
    (_, i) =>
      start === "uniform"
        ? i % n
        : start === "stationary"
          ? sampleDestination(stationary)
          : Number(start),
  );
export default function FlowLab({
  nodes,
  matrix,
  alpha = 1,
  selection,
  onSelect,
  changes = [],
  title = "街の流れを観察",
  autoPlay = false,
}) {
  const { t } = useI18n();
  const transition = useMemo(
    () => buildTransitionMatrix(matrix, alpha),
    [matrix, alpha],
  );
  const stationary = useMemo(
    () => stationaryDistribution(transition),
    [transition],
  );
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const [running, setRunning] = useState(autoPlay && !reduced);
  const [speed, setSpeed] = useState(900);
  const [start, setStart] = useState("uniform");
  const [focus, setFocus] = useState("");
  const [view, setView] = useState({
    step: 0,
    dist: uniform(nodes.length),
    walkers: makeWalkers(nodes.length, "uniform"),
    particles: [],
    errors: [totalVariation(uniform(nodes.length), stationary)],
  });
  const advance = () =>
    setView((previous) => {
      const dist = stepDistribution(previous.dist, transition);
      const walkers = previous.walkers.map((from) =>
        sampleDestination(transition[from]),
      );
      return {
        step: previous.step + 1,
        dist,
        walkers,
        particles: previous.walkers.map((from, i) => ({
          from,
          to: walkers[i],
        })),
        errors: [
          ...previous.errors.slice(-119),
          totalVariation(dist, stationary),
        ],
      };
    });
  useEffect(() => {
    if (!running) return;
    const timer = setInterval(() => {
      if (document.hidden) return;
      setView((previous) => {
        const dist = stepDistribution(previous.dist, transition);
        const walkers = previous.walkers.map((from) =>
          sampleDestination(transition[from]),
        );
        return {
          step: previous.step + 1,
          dist,
          walkers,
          particles: previous.walkers.map((from, i) => ({
            from,
            to: walkers[i],
          })),
          errors: [
            ...previous.errors.slice(-119),
            totalVariation(dist, stationary),
          ],
        };
      });
    }, speed);
    return () => clearInterval(timer);
  }, [running, speed, transition, stationary]);
  const reset = (nextStart) => {
    setStart(nextStart);
    setRunning(false);
    const dist =
      nextStart === "uniform"
        ? uniform(nodes.length)
        : nextStart === "stationary"
          ? stationary
          : nodes.map((_, i) => Number(i === Number(nextStart)));
    setView({
      step: 0,
      dist,
      walkers: makeWalkers(nodes.length, nextStart, stationary),
      particles: [],
      errors: [totalVariation(dist, stationary)],
    });
  };
  const distance = totalVariation(view.dist, stationary);
  const residual = totalVariation(
    stationary,
    stepDistribution(stationary, transition),
  );
  const maxError = Math.max(...view.errors, 0.01);
  const curve = view.errors
    .map(
      (error, i) =>
        `${8 + (i / Math.max(1, view.errors.length - 1)) * 264},${54 - (error / maxError) * 44}`,
    )
    .join(" ");
  return (
    <div className="flow-lab">
      <section className="board-card" aria-label={t(title)}>
        <div className="board-heading">
          <div>
            <span className="eyebrow">THE LIVING NETWORK</span>
            <h2>{t(title)}</h2>
          </div>
          <span className="pill">
            <span className={`status-dot ${running ? "online pulse" : ""}`} />
            {running ? t("移動中") : t("ステップ {0}", [view.step])}
          </span>
        </div>
        <div className="board-tools">
          <label>
            {t("表示する出発点")}{" "}
            <select value={focus} onChange={(e) => setFocus(e.target.value)}>
              <option value="">
                {nodes.length > 6 ? t("選択中の点") : t("すべて")}
              </option>
              {nodes.map((node) => (
                <option key={node.id} value={node.id}>
                  {node.name}
                </option>
              ))}
            </select>
          </label>
          <span>{t("色のついた点 = ランダムに歩く人")}</span>
        </div>
        <NetworkBoard
          nodes={nodes}
          matrix={matrix}
          transition={transition}
          selection={selection}
          onSelect={onSelect}
          changes={changes}
          distribution={view.dist}
          particles={view.particles}
          motionKey={view.step}
          duration={speed}
          focusSource={focus}
        />
        <div className="flow-controls">
          <button
            className="button primary small"
            onClick={() => setRunning(!running)}
          >
            <Icon name={running ? "pause" : "play"} size={16} />
            {running ? t("一時停止") : t("流れを再生")}
          </button>
          <button
            className="button small"
            onClick={() => {
              setRunning(false);
              advance();
            }}
          >
            <Icon name="step" size={16} />
            {t("1ステップ")}
          </button>
          <button
            className="icon-button"
            title={t("初期分布に戻す")}
            aria-label={t("初期分布に戻す")}
            onClick={() => reset(start)}
          >
            <Icon name="reset" size={18} />
          </button>
          <label className="speed-select">
            {t("速さ")}{" "}
            <select
              value={speed}
              onChange={(e) => setSpeed(Number(e.target.value))}
            >
              <option value={1800}>0.5×</option>
              <option value={900}>1×</option>
              <option value={450}>2×</option>
            </select>
          </label>
        </div>
        <div className="start-select">
          <label>
            {t("スタートする場所")}{" "}
            <select value={start} onChange={(e) => reset(e.target.value)}>
              <option value="uniform">{t("全ての点に均等")}</option>
              <option value="stationary">
                {t("定常分布 π から（固定点）")}
              </option>
              {nodes.map((node, i) => (
                <option key={node.id} value={i}>
                  {t("{0}に全員", [node.name])}
                </option>
              ))}
            </select>
          </label>
          <span>
            {start === "stationary"
              ? t("π から1ステップ動かしても、割合は変わらない。")
              : t("出発点を変えても、最後の割合は同じ？")}
          </span>
        </div>
      </section>
      <section
        className="distribution-card"
        aria-label={t("分布と定常分布の比較")}
      >
        <div className="section-heading">
          <div>
            <span className="eyebrow">FIND THE FIXED POINT</span>
            <h3>{t("動き続けても、割合は落ち着く。")}</h3>
          </div>
          <span className={`pill ${distance < 0.001 ? "success" : ""}`}>
            {distance < 0.001
              ? t("定常分布に近づきました")
              : t("ステップ {0}", [view.step])}
          </span>
        </div>
        <div className="distribution-content">
          <div className="distribution-bars">
            <div className="bar-legend">
              <span>{t("■ 今の割合")}</span>
              <span>{t("│ 定常分布 π（目標）")}</span>
            </div>
            {nodes.map((node, i) => (
              <div className="distribution-row" key={node.id}>
                <span className="distribution-name">
                  <i
                    style={{
                      background: COLORS[i],
                    }}
                  />
                  {node.name}
                </span>
                <div className="bar-track">
                  <div
                    className="bar-value"
                    style={{
                      width: `${view.dist[i] * 100}%`,
                      background: COLORS[i],
                    }}
                  />
                  <span
                    className="bar-target"
                    style={{
                      left: `${stationary[i] * 100}%`,
                    }}
                    title={t("定常分布 {0}", [percent(stationary[i])])}
                  />
                </div>
                <span className="mono">
                  {percent(view.dist[i])}
                  <small>π {percent(stationary[i])}</small>
                </span>
              </div>
            ))}
          </div>
          <div className="convergence-metric">
            <span className="muted">{t("定常分布までの距離")}</span>
            <strong>
              {(distance * 100).toFixed(2)}
              <small>%</small>
            </strong>
            <svg
              viewBox="0 0 280 65"
              role="img"
              aria-label={t(
                "定常分布までの全変動距離の推移。直近120ステップ。",
              )}
            >
              <path d="M8 54H272" stroke="#d1dbcf" />
              <polyline
                points={curve}
                fill="none"
                stroke="#267b62"
                strokeWidth="2.5"
              />
            </svg>
            <small>{t("全変動距離 · 直近120ステップ")}</small>
            <div className="formula">π P = π</div>
            <small>
              {t("1回動かしても変わらない割合。")}
              <br />
              {t("計算誤差:")}
              {residual.toExponential(1)}
            </small>
          </div>
        </div>
        <p className="fine-print">
          {t(
            "棒とノード上の数字は xₜ₊₁ = xₜP で計算した、シミュレーション中の割合です。80個の点はランダムな移動の標本なので、数えた割合は揺らぎます。点が止まることと、分布が定常になることは別です。",
          )}
        </p>
        <details className="matrix-details">
          <summary>{t("移動確率の行列 P を見る")}</summary>
          <p className="fine-print">
            {t(
              "行が出発点、列が行き先。各行の合計は100%です（表示の丸めで少しずれることがあります）。",
            )}
          </p>
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>{t("出発 → 行き先")}</th>
                  {nodes.map((node) => (
                    <th key={node.id}>{node.name}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {nodes.map((node, i) => (
                  <tr key={node.id}>
                    <th>{node.name}</th>
                    {transition[i].map((p, j) => (
                      <td key={j}>{percent(p)}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </details>
      </section>
    </div>
  );
}
