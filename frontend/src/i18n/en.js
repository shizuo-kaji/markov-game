// Japanese source messages are the keys; placeholders are substituted after lookup.
export default {
  "{0}：出発点に選択中": "{0}: selected as starting node",
  本文へ移動: "Skip to content",
  "Markovian Town ホーム": "Markovian Town home",
  メインメニュー: "Main menu",
  遊ぶ: "Play",
  実験室: "Lab",
  学ぶ: "Learn",
  エラーを閉じる: "Dismiss error",
  "画面を準備しています…": "Loading…",
  はじめての街: "My first town",
  "つながりの中に、数学を見つけよう。":
    "Discover the mathematics in connections.",
  出発点: "From",
  行き先: "To",
  この辺の重み: "Edge weight",
  "この辺をどう変える？": "How will you change this edge?",
  辺の重みを1減らす: "Decrease edge weight by 1",
  辺の重みを1増やす: "Increase edge weight by 1",
  移動確率: "Transition probability",
  出発点からの確率を比べる: "Compare outgoing probabilities",
  "同じ出発点から出る重みの合計で割ります。1本を増やすと、ほかの行き先の確率は下がります。":
    "Weights are divided by the total leaving the same node. Increasing one weight lowers the probabilities of the other destinations.",
  "計算では全ての重みに ε = 0.01 を加えます。":
    "We add ε = 0.01 to every weight before calculating probabilities.",
  "さらに{0}%の確率で、全ての点へ均等にジャンプします。":
    " There is also a {0}% chance of jumping to a uniformly chosen node.",
  予定している変更: "Your planned changes",
  全て戻す: "Undo all",
  "{0}から{1}への変更を取り消す": "Undo change from {0} to {1}",
  "自分の変更だけなら、どうなる？": "What if only your changes were applied?",
  "まず予想してから開いてみよう。相手の手は含まない仮の得点です。":
    "Make a prediction before opening this. These projected scores do not include other players’ moves.",
  移動中: "Walking",
  "ステップ {0}": "Step {0}",
  表示する出発点: "Show edges from",
  選択中の点: "Selected node",
  すべて: "All nodes",
  "色のついた点 = ランダムに歩く人": "Colored dots = random walkers",
  一時停止: "Pause",
  流れを再生: "Play the flow",
  "1ステップ": "One step",
  初期分布に戻す: "Reset to starting distribution",
  速さ: "Speed",
  スタートする場所: "Starting distribution",
  全ての点に均等: "Uniform across all nodes",
  "定常分布 π から（固定点）": "Stationary distribution π (fixed point)",
  "{0}に全員": "Everyone at {0}",
  "π から1ステップ動かしても、割合は変わらない。":
    "Starting from π, one step leaves the proportions unchanged.",
  "出発点を変えても、最後の割合は同じ？":
    "Different starting places: the same final proportions?",
  分布と定常分布の比較: "Current and stationary distributions",
  "動き続けても、割合は落ち着く。": "People keep moving. Proportions settle.",
  定常分布に近づきました: "Close to the stationary distribution",
  "■ 今の割合": "■ Current proportions",
  "│ 定常分布 π（目標）": "│ Stationary distribution π",
  "定常分布 {0}": "Stationary proportion: {0}",
  定常分布までの距離: "Distance to stationarity",
  "定常分布までの全変動距離の推移。直近120ステップ。":
    "Total variation distance to the stationary distribution over the last 120 steps.",
  "全変動距離 · 直近120ステップ": "Total variation · last 120 steps",
  "1回動かしても変わらない割合。": "Proportions unchanged by one more step.",
  "計算誤差:": "Residual: ",
  "棒とノード上の数字は xₜ₊₁ = xₜP で計算した、シミュレーション中の割合です。80個の点はランダムな移動の標本なので、数えた割合は揺らぎます。点が止まることと、分布が定常になることは別です。":
    "The bars and node labels show proportions calculated with xₜ₊₁ = xₜP. The 80 dots are a sample of random walkers, so their counts fluctuate. A stationary distribution does not mean that people stop moving.",
  "移動確率の行列 P を見る": "Explore the transition matrix P",
  "行が出発点、列が行き先。各行の合計は100%です（表示の丸めで少しずれることがあります）。":
    "Rows are starting nodes; columns are destinations. Each row sums to 100%, apart from rounding in the display.",
  "出発 → 行き先": "From → To",
  "街の有向グラフ。辺を選択、または出発点と行き先を順に選択。":
    "Directed graph of the town. Select an edge, or select a starting node and then a destination.",
  "{0}から{1}、重み{2}、移動確率{3}":
    "From {0} to {1}, weight {2}, transition probability {3}",
  "次に、行き先を選択。同じ点なら自己ループ。":
    "Now choose a destination. Choose the same node for a self-loop.",
  "点が多いため、選択した出発点の辺を表示しています。":
    "For this larger town, edges from the selected starting node are shown.",
  "矢印で向き、数字で重み。点をドラッグして配置できます。":
    "Arrows show direction; numbers show weight. Drag nodes to rearrange them.",
  ホームに戻る: "Back to home",
  "どんな街で遊ぼう？": "What kind of town will you build?",
  "はじめてなら、おすすめの設定でそのまま始められます。":
    "New here? Start with the recommended settings.",
  ラウンド: "Rounds",
  ルームの名前: "Room name",
  プレイヤー: "Players",
  人: "players",
  "公共施設（中立）": "Public places (neutral)",
  点: "nodes",
  "1ラウンドのポイント": "Points per round",
  回: "rounds",
  "{0}を減らす": "Decrease {0}",
  "{0}を増やす": "Increase {0}",
  "おすすめは、2人・中立2点・3ポイント・5ラウンド。":
    "Recommended: 2 players, 2 neutral nodes, 3 points, 5 rounds.",
  "辺の変化を追いやすく、少ない操作で結果を比較できます。今回の入門用設定です。":
    "This introductory setup makes changes easy to follow and compare with just a few moves.",
  コンピューターに任せる席: "Seats controlled by AI",
  "1人で遊ぶ場合は、プレイヤー2をAIにします。":
    "For solo play, let AI control Player 2.",
  "ノードは合計2〜10個、人間のプレイヤーは1人以上にしてください。":
    "Choose 2–10 nodes in total and at least one human player.",
  "街を準備しています…": "Preparing your town…",
  ルームを作って進む: "Create room and continue",
  "ルームはサーバーのメモリに保存され、サーバー再起動でリセットされます。結果は終了時にダウンロードできます。":
    "Rooms are temporary and reset when the server restarts. You can download your results when the game ends.",
  あなた: "You",
  "同じ街で遊ぶ人に、このリンクを共有":
    "Share this link with the people joining your town",
  ルームの共有リンク: "Room sharing link",
  コピー済み: "Copied",
  コピー: "Copy",
  "あなたのお店を選んで、街の流れを変えよう。":
    "Choose your shop and change the flow of the town.",
  "この街で、どんな流れを作る？": "How will people flow through this town?",
  辺の重みを変える: "Change edge weights",
  全員で同時に反映: "Apply everyone’s moves together",
  最後の割合で勝負: "Win with the final proportion",
  "得点は定常分布でのあなたのお店の割合。最初から全ての点の合計は100%です。":
    "Your score is your shop’s share of the stationary distribution. The shares across all nodes always sum to 100%.",
  "どのお店で参加する？": "Which shop will you choose?",
  コンピューターが担当: "Controlled by AI",
  参加済み: "Seat taken",
  参加できます: "Available",
  "あなたの名前（任意）": "Your name (optional)",
  そのままでもOK: "You can keep the default",
  "参加しています…": "Joining…",
  このお店で参加する: "Join as this shop",
  観戦する: "Watch the game",
  "1回の増減に1ポイント。使い切らずに提出してもOK。全員が提出すると流れが変わります。":
    "Each unit of change costs one point. You can submit without using every point. The flow changes once everyone submits.",
  自分の変更だけを試す仮の街: "Preview: only your changes",
  いまの街: "The current town",
  自分の変更だけを盤面でプレビュー: "Preview only my changes on the board",
  相手の手は含みません: "Other players’ moves are not included",
  次の流れをつくろう: "Create the next flow",
  "入ってくる道？ 出ていく道？ 小さな変更が、街全体に響きます。":
    "Incoming paths? Outgoing paths? A small change can affect the whole town.",
  使えるポイント: "Points available",
  "提出しています…": "Submitting…",
  この変更で提出する: "Submit these changes",
  変更せずに提出する: "Submit without changes",
  "提出後は変更できません。": "You cannot change your moves after submitting. ",
  "残り{0}ポイントは持ち越されません。":
    "Your remaining {0} points will not carry over. ",
  "全員の提出後に同時に反映します。":
    "Everyone’s moves take effect together after all players submit.",
  みんなの準備: "Player readiness",
  "（あなた）": " (you)",
  提出済み: "Submitted",
  考え中: "Thinking",
  未参加: "Not joined",
  "作戦のあとを、たどってみよう。": "Trace the story of your strategy.",
  得点の推移: "Score history",
  各プレイヤーのラウンドごとの定常分布の得点:
    "Each player’s stationary proportion by round",
  開始: "Start",
  ラウンドごとの数値を見る: "View scores by round",
  "道が変わった。人の流れは？": "New paths. A new flow?",
  "変更を見て、再生で確かめよう。準備ができるまで、ゆっくり観察できます。":
    "Review the changes and play the flow. Take as much time as you need to observe.",
  結果を見る: "View results",
  次の操作へ: "Plan the next round",
  "ラウンド {0} の街": "The town after round {0}",
  みんなの手の結果: "Everyone’s changes",
  "合計 {0}。重みの下限0で調整。":
    "Combined change: {0}. Adjusted to keep the weight at least 0.",
  "辺の重みに変化はありませんでした。": "No edge weights changed.",
  "得点はどう変わった？": "How did the scores change?",
  "%pt は得点の割合の差（パーセントポイント）。重みを変えるためのポイントとは別です。":
    "%pt means percentage points: the difference between two score percentages. These are separate from the points used to change weights.",
  全員の提出した手を見る: "See all submitted moves",
  振り返ってみよう: "Reflect on what happened",
  "予想と合っていた？ 人が集まっている場所からの道は、どれくらい効いただろう？":
    "Did it match your prediction? How effective were paths from the busiest places?",
  "一緒に、いちばん人気の店へ。": "A tie for the most popular shop!",
  "{0}が、いちばん人気の店に。": "{0} is the most popular shop!",
  "{0}ラウンド、おつかれさまでした。最後の街の流れを振り返ろう。":
    "Rounds completed: {0}. Explore how your town flows now.",
  "最終ラウンドの定常分布で順位を計算しています。公共施設の割合も含めた合計が100%です。":
    "Rankings use the final round’s stationary distribution. Shares sum to 100% when public places are included.",
  "もう一度、新しい街で": "Play again in a new town",
  最後の流れを再生: "Replay the final flow",
  "結果を保存（JSON）": "Save results (JSON)",
  実験室で続きを試す: "Keep exploring in the lab",
  "得点の大きさだけでなく、作戦の理由も。":
    "Explain your strategy, not just your score.",
  "どの変更が効いた？ ほかのプレイヤーの変更で予想が変わった？ グラフを見ながら説明してみよう。":
    "Which changes worked? Did other players’ moves change your prediction? Use the graph to explain.",
  接続を確認してください: "Please check your connection",
  "街を開いています…": "Opening your town…",
  "サーバーの起動には1分ほどかかる場合があります。":
    "The server may take about a minute to start.",
  ホーム: "Home",
  ライブ接続: "Live",
  再接続中: "Reconnecting",
  振り返り: "Review",
  ラウンドを選択: "Choose a round",
  "ラウンド {0}": "Round {0}",
  街の変化を観戦中: "Watching the town evolve",
  "提出完了。みんなの手を待とう。": "Submitted. Waiting for everyone.",
  "あなたの一手で、流れが変わる。": "Your next move changes the flow.",
  現在の街を観察: "Explore the current town",
  "みんなが提出すると、次へ。": "The next round starts when everyone submits.",
  "作戦を予想してみよう。": "What strategies will they choose?",
  "全員の手が揃ったら、自動で新しい街を表示します。観察画面は自分のペースで進められます。":
    "The updated town appears automatically after everyone submits. Explore the review at your own pace.",
  "同じ重みでも、出発点に人が多いほど大きな流れになります。どの道が重要そう？":
    "For the same weights, more people at the starting node means more flow. Which paths seem important?",
  参加する席を選ぶ: "Choose a seat to join",
  "遊びが、発見に変わるまで。": "Turn play into discovery.",
  "数式は、体験したことに名前をつけるために。":
    "Equations give names to things you can experience.",
  実験室を開く: "Open the lab",
  ガイドの目次: "Guide contents",
  遊び方: "How to play",
  数学とのつながり: "The mathematics",
  授業で使う: "In the classroom",
  "あなたのお店に、人を集めよう。": "Bring people to your shop.",
  "街にはプレイヤーのお店と公共施設があります。人々は矢印に沿ってランダムに歩きます。最後に自分のお店にいる人の割合が高いプレイヤーの勝ちです。":
    "The town has players’ shops and public places. People walk randomly along the arrows. The player with the largest stationary share at their shop after the final round wins.",
  予想する: "Predict",
  "どの道を変えれば、人が集まるだろう？ 自分の点に入る道だけでなく、出ていく道にも注目。":
    "Which path will attract people? Look at paths leaving your shop as well as paths entering it.",
  道を変える: "Change a path",
  "矢印か出発点・行き先のメニューで辺を選択。重みを1増減すると1ポイント。ポイントを残して提出しても構いません。余りは次に持ち越しません。":
    "Choose an arrow or use the From and To menus. Each unit of increase or decrease costs one point. You may leave points unused, but they do not carry over.",
  "全員で、いっせいに反映": "Apply all moves together",
  "提出までは何度でも変更できます。提出後は取り消せません。全員の変更を足し合わせ、重みが負になる場合は0にします。AIも変更前の同じ盤面から考えます。":
    "Revise your moves freely before submitting. After submission, they are locked. All changes are added together and any negative weight is set to 0. AI plans from the same unchanged board.",
  "流れを見て、考え直す": "Observe and rethink",
  "各ラウンドの +3 / −2 表示で変化を確認。均等な分布から再生して、新しい定常分布を観察します。得点は累積せず、最終ラウンドの割合で順位が決まります。公共施設にも人がいるので、プレイヤーだけの得点合計は100%になりません。":
    "Check the +3 / −2 labels after each round. Play from a uniform distribution to see the new stationary proportions. Scores do not accumulate: the final proportions decide the ranking. Public places also hold a share, so players’ scores alone do not sum to 100%.",
  "まずは2人・中立2点・3ポイント・5ラウンド。":
    "Start with 2 players, 2 neutral nodes, 3 points and 5 rounds.",
  "1人ならもう一方をAIに。複数人なら同じルームのリンクを共有し、それぞれ違う席に参加します。":
    "For solo play, make the other player AI. For multiplayer, share the room link and choose different seats.",
  "4つの言葉を、体験と結びつけよう。": "Connect four ideas to what you see.",
  "1. 重みは、確率そのものではない": "1. Weights are not probabilities",
  "ある点から出る重みが2と1なら、その2つを選ぶ確率の比は2:1。実際のゲームでは全ての辺（重み0や自己ループを含む）に ε = 0.01 を足してから、出発点ごとに合計で割ります。":
    "Outgoing weights of 2 and 1 would give probabilities in a 2:1 ratio. In this game, we first add ε = 0.01 to every weight, including zeros and self-loops, then divide by the total for that starting node.",
  "各行の合計は1。重み0の道にも、ごく小さな移動確率が残ります。これにより、定常分布がただ1つになり、どの初期分布からもそこへ収束します。":
    "Each row sums to 1. Even a zero-weight path has a small positive probability. This guarantees a unique stationary distribution and convergence to it from any starting distribution.",
  "2. マルコフ連鎖 · Markov chain": "2. Markov chain",
  "次の行き先の確率は「今いる場所」だけで決まります。全体の割合を行ベクトル x とすると、1ステップ後は xP。実験室で「1ステップ」を押すたびに、この計算を行っています。":
    "The probabilities for the next destination depend only on the current location. If the proportions form a row vector x, one step gives xP. This is the calculation behind the lab’s One step button.",
  "3. 定常分布と固定点 · Stationary distribution / fixed point":
    "3. Stationary distribution and fixed point",
  "人は動き続けています。それでも各場所の割合が変わらない状態を定常分布といいます。「1回動かす」という操作の固定点であり、Pの固有値1に対応する左固有ベクトルです。成分は非負で、合計は1です。":
    "People keep moving, but the proportions at each place can stay unchanged. This is a stationary distribution: a fixed point of the one-step update and a left eigenvector of P with eigenvalue 1. Its entries are nonnegative and sum to 1.",
  "stable distribution と表現したくなる「安定した割合」の、ここでの正確な用語は stationary distribution（定常分布）です。「安定分布」は確率論では別の意味でも使われます。":
    "The mathematical term here is stationary distribution. Although the proportions settle down, stable distribution refers to a different concept in probability theory.",
  "4. ページの重要さも、人の流れで · PageRank":
    "4. PageRank: importance through flow",
  "街をウェブに、お店をページに、道をリンクに置き換えてみましょう。リンクをたどる人が長い時間を過ごすページほど、高いスコアになります。実験室では85%の確率で道をたどり、15%で全ての点から均等に選んだ場所へジャンプする設定を試せます。":
    "Imagine the town as the web, shops as pages and paths as links. Pages where a random surfer spends a larger share of time receive higher scores. In the lab, try following paths with probability 85% and jumping to a uniformly chosen node with probability 15%.",
  "このゲームの辺の平滑化 ε と、PageRankのジャンプは異なる操作です。実験室のPageRankは重み付きの道にジャンプを加えたモデルです。":
    "Adding ε to weights and adding PageRank jumps are different operations. The lab’s PageRank model adds jumps to the weighted walk.",
  "参考：": "References: ",
  "20分で、予想・実験・説明。":
    "Predict, experiment and explain in 20 minutes.",
  "以下は今回提案する授業案です。過去の高校生向け実施時の設定や検証済みの学習効果を示すものではありません。":
    "This is a suggested lesson plan, not a record of the earlier high-school activity or a claim of measured learning outcomes.",
  "3分": "3 min",
  "重み2と1から確率を予想。「重みが2倍なら得点も2倍？」":
    "Predict probabilities from weights 2 and 1. Does doubling a weight double the score?",
  "7分": "7 min",
  "2人またはAI相手に5ラウンド。毎回「予想→操作→観察」を言葉にする。":
    "Play five rounds with a partner or AI. Describe your prediction, move and observation each time.",
  "5分": "5 min",
  "実験室で初期分布を変更。同じ割合に落ち着くことを比較。":
    "Change the starting distribution in the lab and compare the proportions they approach.",
  "PageRankのジャンプを試し、閉じ込められた人の流れがどう変わるか説明。":
    "Try PageRank jumps and explain how the flow changes when people can escape a sticky shop.",
  答えを急がない問い: "Questions worth exploring",
  "人数が多い場所からつながる道と、少ない場所からの道。効果は同じ？":
    "Do paths from busy and quiet places have the same effect?",
  "同じ出発点の全ての重みを2倍にすると？ ε を無視した場合と比べてみよう。":
    "What happens if you double every outgoing weight from one node? Compare with the case where ε is ignored.",
  "自分の店から出る道を弱くする戦略には、どんな影響がある？":
    "What happens if you weaken the paths leaving your own shop?",
  "「人が止まる」と「割合が変わらない」は、どう違う？":
    "How is people stopping different from proportions staying the same?",
  "α = 0 にすると、なぜ全ての点の割合が等しくなる？":
    "Why do all nodes have equal shares when α = 0?",
  "結果画面からJSONを保存できます。重み行列・定常分布・公開された変更を振り返りや追加の分析に利用してください。点の色だけでなく、名前・数値・矢印でも情報を確認できます。":
    "Save JSON from the results screen to explore weight matrices, stationary distributions and revealed moves later. Names, numbers and arrows provide information alongside node colors.",
  "人の流れを変える。": "Change the flow.",
  "街の未来が変わる。": "Shape the town.",
  "道の重みを変えて、あなたのお店に人を集めよう。":
    "Change path weights to bring people to your shop.",
  "遊びながら見えてくる、マルコフ連鎖とPageRankの世界。":
    "Discover Markov chains and PageRank through play.",
  "1人で遊んでみる": "Play solo",
  まずは自由に実験: "Explore the lab",
  "予備知識は不要。必要なのは「どうなる？」という好奇心。":
    "No prior knowledge needed. Just ask: what happens next?",
  再接続: "Reconnect",
  初回は1分ほどかかる場合があります: "First connection may take about a minute",
  "道をひとつ変えると、街全体が変わる。":
    "One changed path can reshape the whole town.",
  "重み +3 → あなたのお店に集まる割合は？":
    "Weight +3 → how many people reach your shop?",
  "小さな街から、はじめよう。": "Start with a small town.",
  遊び方を読む: "How to play",
  ルームに参加する: "Join a room",
  更新: "Refresh",
  ルーム名で検索: "Search by room name",
  "ルーム名で探す…": "Find a room…",
  カスタム作成: "Custom room",
  "ラウンド {0} / {1}": "Round {0} / {1}",
  "一致するルームがありません。": "No rooms match your search.",
  "サーバーにつないでいます。実験室はすぐに使えます。":
    "Connecting to the server. You can explore the lab right away.",
  "まだルームがありません。新しい街を作ってみましょう。":
    "No rooms yet. Create a new town!",
  "先生・ファシリテーターの方へ": "For teachers and facilitators",
  "THE FLOW LAB · サーバー接続不要": "THE FLOW LAB · NO SERVER NEEDED",
  "「どうなる？」を、動かしてみる。": "Bring your “what if?” to life.",
  "重みを変える。人の流れを見る。最後に落ち着く割合を見つける。":
    "Change a weight. Follow the people. Find the proportions that settle.",
  ゲームで試す: "Try it in a game",
  実験課題: "Experiments",
  実験中の街: "Your experimental town",
  道を変えてみよう: "Try changing a path",
  "回数もポイントも自由。失敗しても、いつでも戻せます。":
    "No point limit. Experiment freely and reset whenever you like.",
  "あなたの店の割合は？": "What will happen to your shop’s share?",
  "予想してみよう（任意）": "Make a prediction (optional)",
  増える: "Increase",
  減る: "Decrease",
  ほぼ変わらない: "Stay about the same",
  変更して観察: "Apply and observe",
  PageRankモード: "PageRank mode",
  "道に沿って進む確率を変えよう。残りは、全ての点へ均等にジャンプ。":
    "Adjust the chance of following a path. Otherwise, jump to a uniformly chosen node.",
  道をたどる確率: "Probability of following a path",
  "ジャンプの確率を変更しました。分布を均等から再スタートします。":
    "Jump probability changed. Restarting from a uniform distribution.",
  通常のゲーム: "Standard game",
  "U：どの点へも同じ確率で移動。ゲームの ε による平滑化とは別の仕組みです。":
    "U: every node is equally likely. This is separate from adding ε to the game’s edge weights.",
  この実験を最初から: "Reset this experiment",
  "次は「今いる場所」で決まる。": "The next step depends on where you are.",
  "来た道を覚えていなくても、次の行き先の確率が決まります。":
    "You do not need to remember the path so far to know the next-step probabilities.",
  "流れているのに、変わらない。": "Still flowing. Yet unchanged.",
  "人が動き続けても、各場所にいる割合はほぼ一定になります。":
    "People keep moving while the proportions at each place become nearly constant.",
  "同じ操作で、同じ割合に。": "One more step. The same proportions.",
  "πP = π。この「動かしても変わらない分布」が固定点です。":
    "πP = π. A distribution unchanged by the update is a fixed point.",
  まずは1人で: "Start solo",
  おすすめ: "Recommended",
  "あなたとAIの2人。操作と街の流れを、自分のペースで。":
    "You and an AI. Learn the controls and follow the flow at your own pace.",
  "2人で対戦": "Play with a friend",
  約10分: "About 10 min",
  "友達と別々の端末で。予想して、動かして、結果を比べよう。":
    "Join from separate devices. Predict, make your moves and compare results.",
  みんなで実験: "Explore as a group",
  授業向け: "For classrooms",
  "3人と2つの公共施設。戦略を話し合うきっかけに。":
    "Three players and two public places. A starting point for discussing strategies.",
  あなたの店: "Your shop",
  となりの店: "Other shop",
  駅: "Station",
  公園: "Park",
  学校: "School",
  映画館: "Cinema",
  図書館: "Library",
  広場: "Square",
  "プレイヤー {0}": "Player {0}",
  "人が集まる道は？": "Which path attracts people?",
  "駅 → あなたの店の重みを増やすと、店にいる割合はどうなる？ 予想してから変更しよう。":
    "What happens to your shop’s share if you increase Station → Your shop? Predict before making a change.",
  出発点を変えてみよう: "Change the starting point",
  "「あなたの店に全員」と「公園に全員」から再生。同じ定常分布に近づく？ 次は「定常分布 π から」で1ステップ動かして、固定点を確かめよう。":
    "Start with everyone at Your shop, then at Park. Do both approach the same stationary distribution? Next, start from π and take one step to test the fixed point.",
  PageRankを体験: "Experience PageRank",
  "店から出る道を0にして自己ループを強くした街です。ランダムなジャンプを加えると、閉じ込められた人の流れはどう変わる？":
    "This town has a shop with zero outgoing weights and a strong self-loop. How do random jumps change the flow of people who tend to stay there?",
  街の流れを観察: "Observe the town’s flow",
  "予想は「{0}」。": "Your prediction: {0}. ",
  "あなたの店の定常分布：{0} → {1}。流れを再生して確かめよう。":
    "Your shop’s stationary share: {0} → {1}. Play the flow to explore.",
  "{0}人 · 中立{1} · {2}pt · {3}ラウンド":
    "Players: {0} · Neutral: {1} · Points: {2} · Rounds: {3}",
  "{0}人 · {1}pt · {2}ラウンド": "Players: {0} · Points: {1} · Rounds: {2}",
  "{0}人 · 中立{1} · {2}pt / ラウンド":
    "Players: {0} · Neutral: {1} · {2} pts / round",
  "{0}pt × {1}ラウンド": "{0} pts / round · Rounds: {1}",
  "サーバーにつながりませんでした。少し待って再試行してください。実験室は接続なしで使えます。":
    "Could not connect to the server. Please wait and try again. The lab works without a server connection.",
  "入力内容を確認して、もう一度お試しください。":
    "Please check your input and try again.",
  "送信結果を確認できませんでした。再提出しても二重送信にはなりません。":
    "Could not confirm the submission. You can safely submit again without applying your moves twice.",
  "接続を確認しています。操作内容はこの端末に保存されています。":
    "Checking the connection. Your draft is saved on this device.",
  "このルームは見つかりません。ホームから新しく作成してください。":
    "This room could not be found. Create a new one from the home screen.",
  "ルームが見つかりません。サーバー再起動で消えた可能性があります。":
    "Room not found. It may have been cleared when the server restarted.",
  "終了したゲームです。結果を見たり、新しいルームを作ったりできます。":
    "This game has ended. You can view its results or create a new room.",
  "人間のプレイヤーを選んでください。": "Please choose a human player’s seat.",
  "このプレイヤーは参加済みです。別の席を選んでください。":
    "This seat is already taken. Please choose another.",
  "参加情報がありません。ロビーから参加し直してください。":
    "Your participation could not be verified. Please rejoin from the lobby.",
  "同じ送信番号で異なる内容は送れません。":
    "A retry must contain the same moves as the original submission.",
  "ラウンドが変わりました。最新の盤面を確認してください。":
    "The round has changed. Please check the latest board.",
  "このラウンドは提出済みです。": "You have already submitted for this round.",
  "使えるポイントを超えています。": "You have exceeded your point budget.",
  "辺または変更量が不正です。": "The edge or change amount is invalid.",
  "同じ辺への変更はまとめてください。":
    "Please combine changes to the same edge.",
  "辺の重みは0未満にできません。": "Edge weights cannot be negative.",
  言語: "Language",
  "マルコフ連鎖を、遊んで学ぶ": "Learn Markov chains through play",
  "道を変え、人の流れを観察する。マルコフ連鎖・定常分布・PageRankを体験できるゲーム。":
    "Change paths and follow the flow. Explore Markov chains, stationary distributions and PageRank through play.",
};
