import { useI18n } from "../i18n/useI18n.js";
import { useMemo } from "react";
import {
  applyMoves,
  buildTransitionMatrix,
  stationaryDistribution,
  percent,
  signed,
  COLORS,
} from "../utils/markov.js";
import Icon from "./Icon.jsx";
export default function EdgeEditor({
  nodes,
  matrix,
  selection,
  onSelect,
  moves = [],
  onChange,
  budget,
  alpha = 1,
  disabled = false,
  experiment = false,
}) {
  const { t } = useI18n();
  const source = Math.max(
    0,
    nodes.findIndex((node) => node.id === selection?.source),
  );
  const target = Math.max(
    0,
    nodes.findIndex((node) => node.id === selection?.target),
  );
  const selectedMove = moves.find(
    (move) =>
      move.source === nodes[source].id && move.target === nodes[target].id,
  );
  const delta = selectedMove?.delta || 0;
  const projected = useMemo(
    () => applyMoves(matrix, nodes, moves),
    [matrix, nodes, moves],
  );
  const transition = useMemo(
    () => buildTransitionMatrix(matrix, alpha),
    [matrix, alpha],
  );
  const nextTransition = useMemo(
    () => buildTransitionMatrix(projected, alpha),
    [projected, alpha],
  );
  const baseline = useMemo(
    () => stationaryDistribution(transition),
    [transition],
  );
  const predicted = useMemo(
    () => stationaryDistribution(nextTransition),
    [nextTransition],
  );
  const spent = moves.reduce((sum, move) => sum + Math.abs(move.delta), 0);
  const canChange = (next) =>
    !disabled &&
    matrix[source][target] + next >= 0 &&
    (!Number.isFinite(budget) ||
      spent - Math.abs(delta) + Math.abs(next) <= budget);
  return (
    <>
      <div className="edge-selects">
        <label className="field">
          {t("出発点")}
          <select
            value={nodes[source].id}
            disabled={disabled}
            onChange={(e) =>
              onSelect({
                source: e.target.value,
                target: nodes[target].id,
              })
            }
          >
            {nodes.map((node) => (
              <option key={node.id} value={node.id}>
                {node.name}
              </option>
            ))}
          </select>
        </label>
        <Icon name="arrow" size={18} />
        <label className="field">
          {t("行き先")}
          <select
            value={nodes[target].id}
            disabled={disabled}
            onChange={(e) =>
              onSelect({
                source: nodes[source].id,
                target: e.target.value,
              })
            }
          >
            {nodes.map((node) => (
              <option key={node.id} value={node.id}>
                {node.name}
              </option>
            ))}
          </select>
        </label>
      </div>
      <div className="weight-control">
        <span className="muted">
          {experiment ? t("この辺の重み") : t("この辺をどう変える？")}
        </span>
        <div className="weight-stepper">
          <button
            className="button"
            aria-label={t("辺の重みを1減らす")}
            disabled={!canChange(delta - 1)}
            onClick={() =>
              onChange(nodes[source].id, nodes[target].id, delta - 1)
            }
          >
            −
          </button>
          <strong>
            {matrix[source][target]}
            <span>→</span>
            {projected[source][target]}
          </strong>
          <button
            className="button"
            aria-label={t("辺の重みを1増やす")}
            disabled={!canChange(delta + 1)}
            onClick={() =>
              onChange(nodes[source].id, nodes[target].id, delta + 1)
            }
          >
            +
          </button>
        </div>
        <span className="pill">
          {t("移動確率")} {percent(transition[source][target])} →{" "}
          {percent(nextTransition[source][target])}
        </span>
      </div>
      <details className="probability-details">
        <summary>{t("出発点からの確率を比べる")}</summary>
        <p className="fine-print">
          {t(
            "同じ出発点から出る重みの合計で割ります。1本を増やすと、ほかの行き先の確率は下がります。",
          )}
        </p>
        <div className="probability-list">
          {nodes.map((node, i) => (
            <button
              key={node.id}
              onClick={() =>
                onSelect({
                  source: nodes[source].id,
                  target: node.id,
                })
              }
              disabled={disabled}
              className={i === target ? "selected-probability" : ""}
            >
              <span>
                <i
                  style={{
                    background: COLORS[i],
                  }}
                />
                {node.name}
              </span>
              <span>
                {percent(transition[source][i])} →{" "}
                <b>{percent(nextTransition[source][i])}</b>
              </span>
            </button>
          ))}
        </div>
        <p className="fine-print">
          {t("計算では全ての重みに ε = 0.01 を加えます。")}
          {alpha < 1 &&
            t("さらに{0}%の確率で、全ての点へ均等にジャンプします。", [
              Math.round((1 - alpha) * 100),
            ])}
        </p>
      </details>
      {!!moves.length && (
        <div className="draft-list">
          <div className="section-heading">
            <h3>{t("予定している変更")}</h3>
            <button
              className="text-link"
              disabled={disabled}
              onClick={() => onChange(null, null, 0)}
            >
              {t("全て戻す")}
            </button>
          </div>
          {moves.map((move) => (
            <div className="draft-item" key={`${move.source}-${move.target}`}>
              <span>
                {nodes.find((n) => n.id === move.source)?.name} →{" "}
                {nodes.find((n) => n.id === move.target)?.name}
              </span>
              <b className={move.delta > 0 ? "positive" : "negative"}>
                {signed(move.delta)}
              </b>
              <button
                className="icon-button"
                disabled={disabled}
                aria-label={t("{0}から{1}への変更を取り消す", [
                  nodes.find((n) => n.id === move.source)?.name,
                  nodes.find((n) => n.id === move.target)?.name,
                ])}
                onClick={() => onChange(move.source, move.target, 0)}
              >
                <Icon name="close" size={14} />
              </button>
            </div>
          ))}
        </div>
      )}
      <details className="prediction-details">
        <summary>{t("自分の変更だけなら、どうなる？")}</summary>
        <p className="fine-print">
          {t("まず予想してから開いてみよう。相手の手は含まない仮の得点です。")}
        </p>
        {nodes
          .filter((n) => n.kind === "player")
          .map((node) => {
            const i = nodes.indexOf(node);
            return (
              <div className="prediction-row" key={node.id}>
                <span>{node.name}</span>
                <b>{percent(predicted[i])}</b>
                <small
                  className={
                    predicted[i] >= baseline[i] ? "positive" : "negative"
                  }
                >
                  {signed(
                    Number(((predicted[i] - baseline[i]) * 100).toFixed(1)),
                  )}{" "}
                  %pt
                </small>
              </div>
            );
          })}
      </details>
    </>
  );
}
