import { useI18n } from "../i18n/useI18n.js";
import { useCallback, useEffect, useMemo, useState } from "react";
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
} from "../utils/markov.js";

const makeView = (dist, stationary) => ({
  step: 0,
  dist,
  particles: [],
  walkers: Array.from({ length: 80 }, () => sampleDestination(dist)),
  errors: [totalVariation(dist, stationary)],
});

export default function FlowLab({
  nodes,
  matrix,
  alpha = 1,
  selection,
  onSelect,
  changes = [],
  title = "街の流れを観察",
  autoPlay = false,
  mode = "experiment",
  initialDistribution,
}) {
  const { t } = useI18n();
  const planning = mode === "planning";
  const transition = useMemo(
    () => buildTransitionMatrix(matrix, alpha),
    [matrix, alpha],
  );
  const stationary = useMemo(
    () => stationaryDistribution(transition),
    [transition],
  );
  const initial = initialDistribution || uniform(nodes.length);
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const [running, setRunning] = useState(!planning && autoPlay && !reduced);
  const [speed, setSpeed] = useState(900);
  const [start, setStart] = useState(
    initialDistribution ? "previous" : "uniform",
  );
  const [focus, setFocus] = useState("");
  const [view, setView] = useState(() => makeView(initial, stationary));
  const advance = useCallback(
    () =>
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
      }),
    [transition, stationary],
  );
  useEffect(() => {
    if (!running || planning) return;
    const timer = setInterval(() => {
      if (!document.hidden) advance();
    }, speed);
    return () => clearInterval(timer);
  }, [running, planning, speed, advance]);
  const reset = (nextStart) => {
    setStart(nextStart);
    setRunning(false);
    const dist =
      nextStart === "previous"
        ? initial
        : nextStart === "uniform"
          ? uniform(nodes.length)
          : nextStart === "stationary"
            ? stationary
            : nodes.map((_, i) => Number(i === Number(nextStart)));
    setView(makeView(dist, stationary));
  };
  // Planning always uses the exact stationary solve, including a proposed board.
  const distribution = planning ? stationary : view.dist;
  const distance = totalVariation(distribution, stationary);
  const maxError = Math.max(...view.errors, 0.01);
  const curve = view.errors
    .map(
      (error, i) =>
        `${4 + (i / Math.max(1, view.errors.length - 1)) * 112},${34 - (error / maxError) * 30}`,
    )
    .join(" ");
  return (
    <div
      className={`flow-lab ${planning ? "planning-board" : "simulation-board"}`}
    >
      <section className="board-card" aria-label={t(title)}>
        <div className="board-heading">
          <h2>{t(title)}</h2>
          <span
            className={`pill ${planning || distance < 0.001 ? "success" : ""}`}
          >
            {planning ? t("定常分布 π") : t("ステップ {0}", [view.step])}
          </span>
        </div>
        <div className="board-tools">
          <label>
            {t("出発点")}{" "}
            <select
              value={focus}
              onChange={(event) => setFocus(event.target.value)}
            >
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
          <span>
            {planning
              ? t("割合 = 得点 · πP = π")
              : t("円弧：今の割合 / 目印：定常分布 π")}
          </span>
        </div>
        <NetworkBoard
          nodes={nodes}
          matrix={matrix}
          transition={transition}
          selection={selection}
          onSelect={onSelect}
          changes={changes}
          distribution={distribution}
          targetDistribution={planning ? undefined : stationary}
          particles={planning ? [] : view.particles}
          motionKey={view.step}
          duration={speed}
          focusSource={focus}
        />
        {!planning && (
          <>
            <div className="convergence-strip">
              <div>
                <span>{t("定常分布までの距離")}</span>
                <strong>{(distance * 100).toFixed(2)}%</strong>
              </div>
              <svg
                viewBox="0 0 120 38"
                role="img"
                aria-label={t(
                  "定常分布までの全変動距離の推移。直近120ステップ。",
                )}
              >
                <path d="M4 34H116" stroke="#d1dbcf" />
                <polyline
                  points={curve}
                  fill="none"
                  stroke="#267b62"
                  strokeWidth="2"
                />
              </svg>
              <span className="fixed-point-note">
                {distance < 0.001
                  ? t("ほぼ定常 · 人は動き、割合は保たれる")
                  : t("xₜ₊₁ = xₜP → π")}
              </span>
            </div>
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
                className="button small"
                onClick={() => reset("stationary")}
              >
                {t("定常分布を表示")}
              </button>
              <button
                className="icon-button"
                title={t("初期分布に戻す")}
                aria-label={t("初期分布に戻す")}
                onClick={() =>
                  reset(initialDistribution ? "previous" : "uniform")
                }
              >
                <Icon name="reset" size={18} />
              </button>
            </div>
            <details className="simulation-settings">
              <summary>{t("初期分布・再生速度")}</summary>
              <div className="simulation-options">
                <label>
                  {t("初期分布")}
                  <select
                    value={start}
                    onChange={(event) => reset(event.target.value)}
                  >
                    {initialDistribution && (
                      <option value="previous">
                        {t("前ラウンドの定常分布")}
                      </option>
                    )}
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
                <label>
                  {t("速さ")}
                  <select
                    value={speed}
                    onChange={(event) => setSpeed(Number(event.target.value))}
                  >
                    <option value={1800}>0.5×</option>
                    <option value={900}>1×</option>
                    <option value={450}>2×</option>
                  </select>
                </label>
              </div>
              <p className="fine-print">
                {t(
                  "割合は xₜ₊₁ = xₜP で計算。点は80人のランダムな移動を表します。",
                )}
              </p>
              <p className="fine-print">
                {t("π から1ステップ動かしても、割合は変わらない。")}
              </p>
            </details>
          </>
        )}
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
