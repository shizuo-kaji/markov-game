import { useI18n } from "../i18n/useI18n.js";
import Icon from "../components/Icon.jsx";
export default function Guide() {
  const { t } = useI18n();
  return (
    <div className="page guide-page">
      <div className="page-heading">
        <div>
          <span className="eyebrow">A FIELD GUIDE TO THE FLOW</span>
          <h1>{t("遊びが、発見に変わるまで。")}</h1>
          <p className="lead">
            {t("数式は、体験したことに名前をつけるために。")}
          </p>
        </div>
        <a className="button primary" href="#lab">
          {t("実験室を開く")}
          <Icon name="arrow" />
        </a>
      </div>
      <div className="guide-layout">
        <nav className="guide-nav" aria-label={t("ガイドの目次")}>
          <a
            href="#guide"
            onClick={(e) => {
              e.preventDefault();
              document.getElementById("rules").scrollIntoView();
            }}
          >
            {t("遊び方")}
          </a>
          <a
            href="#guide"
            onClick={(e) => {
              e.preventDefault();
              document.getElementById("concepts").scrollIntoView();
            }}
          >
            {t("数学とのつながり")}
          </a>
          <a
            href="#guide"
            onClick={(e) => {
              e.preventDefault();
              document.getElementById("teachers").scrollIntoView();
            }}
          >
            {t("授業で使う")}
          </a>
        </nav>
        <div className="guide-content">
          <section id="rules" className="panel">
            <span className="eyebrow">HOW TO PLAY</span>
            <h2>{t("あなたのお店に、人を集めよう。")}</h2>
            <p>
              {t(
                "街にはプレイヤーのお店と公共施設があります。人々は矢印に沿ってランダムに歩きます。最後に自分のお店にいる人の割合が高いプレイヤーの勝ちです。",
              )}
            </p>
            <ol className="steps">
              <li>
                <strong>{t("予想する")}</strong>
                <p>
                  {t(
                    "どの道を変えれば、人が集まるだろう？ 自分の点に入る道だけでなく、出ていく道にも注目。",
                  )}
                </p>
              </li>
              <li>
                <strong>{t("道を変える")}</strong>
                <p>
                  {t(
                    "矢印か出発点・行き先のメニューで辺を選択。重みを1増減すると1ポイント。ポイントを残して提出しても構いません。余りは次に持ち越しません。",
                  )}
                </p>
              </li>
              <li>
                <strong>{t("全員で、いっせいに反映")}</strong>
                <p>
                  {t(
                    "提出までは何度でも変更できます。提出後は取り消せません。全員の変更を足し合わせ、重みが負になる場合は0にします。AIも変更前の同じ盤面から考えます。",
                  )}
                </p>
              </li>
              <li>
                <strong>{t("流れを見て、考え直す")}</strong>
                <p>
                  {t(
                    "辺の +3 / −2 が重みの変化です。ラウンド間は前の分布から新しい定常分布への収束を表示し、作戦中は定常分布を表示します。得点は累積せず、最終ラウンドの割合で順位が決まります。公共施設の割合も含めて合計100%です。",
                  )}
                </p>
              </li>
            </ol>
            <div className="callout">
              <Icon name="people" />
              <p>
                <strong>
                  {t("まずは2人・中立2点・3ポイント・5ラウンド。")}
                </strong>
                <br />
                {t(
                  "1人ならもう一方をAIに。複数人なら同じルームのリンクを共有し、それぞれ違う席に参加します。",
                )}
              </p>
            </div>
          </section>
          <section id="concepts" className="panel">
            <span className="eyebrow">THE MATHEMATICS</span>
            <h2>{t("4つの言葉を、体験と結びつけよう。")}</h2>
            <article>
              <h3>{t("1. 重みは、確率そのものではない")}</h3>
              <p>
                {t(
                  "ある点から出る重みが2と1なら、その2つを選ぶ確率の比は2:1。実際のゲームでは全ての辺（重み0や自己ループを含む）に ε = 0.01 を足してから、出発点ごとに合計で割ります。",
                )}
              </p>
              <div className="formula">Pᵢⱼ = (wᵢⱼ + ε) / Σₖ(wᵢₖ + ε)</div>
              <p>
                {t(
                  "各行の合計は1。重み0の道にも、ごく小さな移動確率が残ります。これにより、定常分布がただ1つになり、どの初期分布からもそこへ収束します。",
                )}
              </p>
            </article>
            <article>
              <h3>{t("2. マルコフ連鎖 · Markov chain")}</h3>
              <p>
                {t(
                  "次の行き先の確率は「今いる場所」だけで決まります。全体の割合を行ベクトル x とすると、1ステップ後は xP。実験室で「1ステップ」を押すたびに、この計算を行っています。",
                )}
              </p>
              <div className="formula">xₜ₊₁ = xₜ P</div>
            </article>
            <article>
              <h3>
                {t(
                  "3. 定常分布と固定点 · Stationary distribution / fixed point",
                )}
              </h3>
              <p>
                {t(
                  "人は動き続けています。それでも各場所の割合が変わらない状態を定常分布といいます。「1回動かす」という操作の固定点であり、Pの固有値1に対応する左固有ベクトルです。成分は非負で、合計は1です。",
                )}
              </p>
              <div className="formula">π P = π &nbsp; · &nbsp; Σᵢ πᵢ = 1</div>
              <p>
                {t(
                  "stable distribution と表現したくなる「安定した割合」の、ここでの正確な用語は stationary distribution（定常分布）です。「安定分布」は確率論では別の意味でも使われます。",
                )}
              </p>
            </article>
            <article>
              <h3>{t("4. ページの重要さも、人の流れで · PageRank")}</h3>
              <p>
                {t(
                  "街をウェブに、お店をページに、道をリンクに置き換えてみましょう。リンクをたどる人が長い時間を過ごすページほど、高いスコアになります。実験室では85%の確率で道をたどり、15%で全ての点から均等に選んだ場所へジャンプする設定を試せます。",
                )}
              </p>
              <div className="formula">Pα = αP + (1 − α)U</div>
              <p>
                {t(
                  "このゲームの辺の平滑化 ε と、PageRankのジャンプは異なる操作です。実験室のPageRankは重み付きの道にジャンプを加えたモデルです。",
                )}
              </p>
              <p className="fine-print">
                {t("参考：")}
                <a
                  href="https://nlp.stanford.edu/IR-book/html/htmledition/pagerank-1.html"
                  target="_blank"
                  rel="noreferrer"
                >
                  Stanford, Introduction to Information Retrieval — PageRank
                </a>{" "}
                /{" "}
                <a
                  href="https://cs50.harvard.edu/ai/projects/2/pagerank/"
                  target="_blank"
                  rel="noreferrer"
                >
                  Harvard CS50 — PageRank
                </a>
              </p>
            </article>
          </section>
          <section id="teachers" className="panel">
            <span className="eyebrow">FOR THE CLASSROOM</span>
            <h2>{t("20分で、予想・実験・説明。")}</h2>
            <p>
              {t(
                "以下は今回提案する授業案です。過去の高校生向け実施時の設定や検証済みの学習効果を示すものではありません。",
              )}
            </p>
            <div className="lesson-plan">
              <div>
                <strong>{t("3分")}</strong>
                <span>
                  {t("重み2と1から確率を予想。「重みが2倍なら得点も2倍？」")}
                </span>
              </div>
              <div>
                <strong>{t("7分")}</strong>
                <span>
                  {t(
                    "2人またはAI相手に5ラウンド。毎回「予想→操作→観察」を言葉にする。",
                  )}
                </span>
              </div>
              <div>
                <strong>{t("5分")}</strong>
                <span>
                  {t("実験室で初期分布を変更。同じ割合に落ち着くことを比較。")}
                </span>
              </div>
              <div>
                <strong>{t("5分")}</strong>
                <span>
                  {t(
                    "PageRankのジャンプを試し、閉じ込められた人の流れがどう変わるか説明。",
                  )}
                </span>
              </div>
            </div>
            <h3>{t("答えを急がない問い")}</h3>
            <ul>
              <li>
                {t(
                  "人数が多い場所からつながる道と、少ない場所からの道。効果は同じ？",
                )}
              </li>
              <li>
                {t(
                  "同じ出発点の全ての重みを2倍にすると？ ε を無視した場合と比べてみよう。",
                )}
              </li>
              <li>
                {t("自分の店から出る道を弱くする戦略には、どんな影響がある？")}
              </li>
              <li>{t("「人が止まる」と「割合が変わらない」は、どう違う？")}</li>
              <li>{t("α = 0 にすると、なぜ全ての点の割合が等しくなる？")}</li>
            </ul>
            <p>
              {t(
                "結果画面からJSONを保存できます。重み行列・定常分布・公開された変更を振り返りや追加の分析に利用してください。点の色だけでなく、名前・数値・矢印でも情報を確認できます。",
              )}
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
