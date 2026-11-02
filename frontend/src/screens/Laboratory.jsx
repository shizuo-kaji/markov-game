import { localizeNodes } from "../i18n/core.js";
import { useI18n } from "../i18n/useI18n.js";
import { useMemo, useState } from "react";
import FlowLab from "../components/FlowLab.jsx";
import EdgeEditor from "../components/EdgeEditor.jsx";
import Icon from "../components/Icon.jsx";
import { LAB_NODES } from "../utils/presets.js";
import {
  applyMoves,
  initialMatrix,
  buildTransitionMatrix,
  stationaryDistribution,
  percent,
} from "../utils/markov.js";
const challenges = [
  {
    title: "人が集まる道は？",
    description:
      "駅 → あなたの店の重みを増やすと、店にいる割合はどうなる？ 予想してから変更しよう。",
  },
  {
    title: "出発点を変えてみよう",
    description:
      "「あなたの店に全員」と「公園に全員」から再生。同じ定常分布に近づく？ 次は「定常分布 π から」で1ステップ動かして、固定点を確かめよう。",
  },
  {
    title: "PageRankを体験",
    description:
      "店から出る道を0にして自己ループを強くした街です。ランダムなジャンプを加えると、閉じ込められた人の流れはどう変わる？",
  },
];
export default function Laboratory() {
  const { t } = useI18n();
  const nodes = useMemo(() => localizeNodes(LAB_NODES, t), [t]);
  const [matrix, setMatrix] = useState(initialMatrix);
  const [moves, setMoves] = useState([]);
  const [selection, setSelection] = useState({
    source: "n1",
    target: "p1",
  });
  const [alpha, setAlpha] = useState(1);
  const [challenge, setChallenge] = useState(0);
  const [prediction, setPrediction] = useState("");
  const [run, setRun] = useState(0);
  const [message, setMessage] = useState("");
  const proposed = useMemo(
    () => applyMoves(matrix, LAB_NODES, moves),
    [matrix, moves],
  );
  const change = (source, target, delta) => {
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
  const applyExperiment = () => {
    const before = stationaryDistribution(
      buildTransitionMatrix(matrix, alpha),
    )[0];
    const after = stationaryDistribution(
      buildTransitionMatrix(proposed, alpha),
    )[0];
    setMatrix(proposed);
    setMoves([]);
    setRun((r) => r + 1);
    setMessage({ prediction, before: percent(before), after: percent(after) });
  };
  const loadChallenge = (index) => {
    setChallenge(index);
    setMoves([]);
    setPrediction("");
    setMessage("");
    setAlpha(1);
    setRun((r) => r + 1);
    const next = initialMatrix();
    if (index === 2) {
      next[0] = [8, 0, 0, 0];
      setSelection({
        source: "p1",
        target: "p1",
      });
    } else
      setSelection({
        source: "n1",
        target: "p1",
      });
    setMatrix(next);
  };
  return (
    <div className="page">
      <div className="page-heading">
        <div>
          <span className="eyebrow">
            {t("THE FLOW LAB · サーバー接続不要")}
          </span>
          <h1>{t("「どうなる？」を、動かしてみる。")}</h1>
          <p className="lead">
            {t("重みを変える。人の流れを見る。最後に落ち着く割合を見つける。")}
          </p>
        </div>
        <a className="button" href="#new">
          {t("ゲームで試す")}
          <Icon name="arrow" />
        </a>
      </div>
      <div className="challenge-tabs" aria-label={t("実験課題")}>
        {challenges.map((item, i) => (
          <button
            className={i === challenge ? "active" : ""}
            key={t(item.title)}
            onClick={() => loadChallenge(i)}
          >
            <span>0{i + 1}</span>
            {t(item.title)}
          </button>
        ))}
      </div>
      <div className="challenge-banner">
        <span className="feature-icon">
          <Icon name="lab" />
        </span>
        <div>
          <strong>{t(challenges[challenge].title)}</strong>
          <p>{t(challenges[challenge].description)}</p>
        </div>
      </div>
      <div className="game-layout">
        <FlowLab
          key={`${run}-${alpha}`}
          nodes={nodes}
          matrix={matrix}
          alpha={alpha}
          selection={selection}
          onSelect={setSelection}
          autoPlay={run > 0}
          title={t("実験中の街")}
        />
        <aside className="editor-panel">
          <div className="editor-heading">
            <span className="eyebrow">TRY A SMALL CHANGE</span>
            <h2>{t("道を変えてみよう")}</h2>
            <p>{t("回数もポイントも自由。失敗しても、いつでも戻せます。")}</p>
          </div>
          <EdgeEditor
            nodes={nodes}
            matrix={matrix}
            selection={selection}
            onSelect={setSelection}
            moves={moves}
            onChange={change}
            alpha={alpha}
            experiment
          />
          <label className="field prediction-question">
            {t("あなたの店の割合は？")}
            <select
              value={prediction}
              onChange={(event) => setPrediction(event.target.value)}
            >
              <option value="">{t("予想してみよう（任意）")}</option>
              <option value="増える">{t("増える")}</option>
              <option value="減る">{t("減る")}</option>
              <option value="ほぼ変わらない">{t("ほぼ変わらない")}</option>
            </select>
          </label>
          <button
            className="button primary full"
            disabled={!moves.length}
            onClick={applyExperiment}
          >
            {t("変更して観察")}
            <Icon name="play" size={17} />
          </button>
          {message && (
            <p className="inline-feedback" role="status">
              {typeof message === "string" ? (
                t(message)
              ) : (
                <>
                  {message.prediction &&
                    t("予想は「{0}」。", [t(message.prediction)])}
                  {t(
                    "あなたの店の定常分布：{0} → {1}。流れを再生して確かめよう。",
                    [message.before, message.after],
                  )}
                </>
              )}
            </p>
          )}
          <div className="pagerank-control">
            <div className="section-heading">
              <h3>{t("PageRankモード")}</h3>
              <span className="pill">α = {alpha.toFixed(2)}</span>
            </div>
            <p>
              {t(
                "道に沿って進む確率を変えよう。残りは、全ての点へ均等にジャンプ。",
              )}
            </p>
            <label className="field" htmlFor="alpha">
              {t("道をたどる確率")} {Math.round(alpha * 100)}%
              <input
                id="alpha"
                type="range"
                min="0"
                max="100"
                step="5"
                value={alpha * 100}
                onChange={(e) => {
                  setAlpha(Number(e.target.value) / 100);
                  setMessage(
                    "ジャンプの確率を変更しました。分布を均等から再スタートします。",
                  );
                }}
              />
            </label>
            <div className="segmented">
              <button
                className={alpha === 1 ? "active" : ""}
                onClick={() => setAlpha(1)}
              >
                {t("通常のゲーム")}
              </button>
              <button
                className={alpha === 0.85 ? "active" : ""}
                onClick={() => setAlpha(0.85)}
              >
                PageRank 85%
              </button>
            </div>
            <div className="formula small-formula">Pα = αP + (1 − α)U</div>
            <small>
              {t(
                "U：どの点へも同じ確率で移動。ゲームの ε による平滑化とは別の仕組みです。",
              )}
            </small>
          </div>
          <button
            className="button full"
            onClick={() => loadChallenge(challenge)}
          >
            <Icon name="reset" size={17} />
            {t("この実験を最初から")}
          </button>
        </aside>
      </div>
      <div className="learning-strip">
        <div>
          <span>01 / MARKOV CHAIN</span>
          <h3>{t("次は「今いる場所」で決まる。")}</h3>
          <p>{t("来た道を覚えていなくても、次の行き先の確率が決まります。")}</p>
        </div>
        <div>
          <span>02 / STATIONARY DISTRIBUTION</span>
          <h3>{t("流れているのに、変わらない。")}</h3>
          <p>{t("人が動き続けても、各場所にいる割合はほぼ一定になります。")}</p>
        </div>
        <div>
          <span>03 / FIXED POINT</span>
          <h3>{t("同じ操作で、同じ割合に。")}</h3>
          <p>{t("πP = π。この「動かしても変わらない分布」が固定点です。")}</p>
        </div>
      </div>
    </div>
  );
}
