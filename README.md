# Markov Chain Game

マルコフ連鎖の概念を体験できる、インタラクティブなウェブゲームです。プレイヤーはグラフのエッジの重みを操作し、マルコフ過程の定常状態（固有ベクトル）に基づいてスコアを競います。

このゲームは、2025年7月30日に九州大学で開催された
[IMI福岡県立高校生対象アウトリーチ「Math for the Future」](https://www.imi.kyushu-u.ac.jp/post-17364/)：「数式で未来をのぞく 〜シンプル・ルールでシミュレーション〜」
のために作成されました。

[こちらからお試しプレイできます](https://markov-game-frontend.onrender.com/)
"Create New Room" の際，バックエンド起動まで30秒くらい時間がかかる場合があります．焦らずお待ちを．

また、理解の補助として[マルコフチェーンシミュレーター](https://shizuo-kaji.github.io/markov-simple/)もご参照ください。

これらは教育目的で自由に再利用（改変を含む）していただけます。
もし面白い利用事例があれば、お知らせいただけると幸いです。

created by Shizuo KAJI and Sebastian Elias Graiff Zurita

![ゲームプレイ画面](https://github.com/shizuo-kaji/markov-game/blob/main/images/playscreen.jpg?raw=true)

## 概要

このゲームは、プレイヤーがグラフの構造に影響を与え、その結果として生じるマルコフ連鎖の定常状態を操作することを目指します。各ターンでプレイヤーは限られたポイントを消費してエッジの重みを変更し、最終的なスコアは定常状態におけるプレイヤーノードの成分によって決定されます。

## 機能

- **ルーム管理**: 既存のゲームルームに参加するか、新しいルームを作成できます。
- **カスタマイズ可能なルーム設定**: 新規ルーム作成時に、プレイヤー数、非プレイヤーノード数、ラウンドごとのポイント、最大ターン数を設定できます。
- **AIプレイヤー指定**: ルーム作成時に任意のプレイヤー枠をAIとして設定でき、AIは各ターン自動でムーブを提出し、行動理由をツールチップや「AI Insights」に表示します（APIでは `ai_player_positions` フィールドに1始まりの数値配列を渡します）。
- **リアルタイムなゲーム進行**: WebSocketを通じて、他のプレイヤーの動きやスコア計算の更新がリアルタイムで反映されます。
- **インタラクティブなグラフ表示**: 現在のグラフの状態（ノードとエッジ、重み）を視覚的に表示します。頂点位置はドラッグで自由に配置できます．
- **スコア計算とランキング**: 各ターンの終了時にマルコフ連鎖の定常状態を計算し、プレイヤーのスコアを更新します。ゲーム終了時には最終ランキングが表示されます。

## ゲームルール

- **プレイヤー数**: N人で対戦します。
- **初期盤面**: N個のプレイヤーノードとM個の非プレイヤーノードが、対称的に適当に連結された重み付きグラフが初期盤面となります。
- **ラウンドの進行**: 各ラウンドで、それぞれのプレイヤーには K ポイントが割り振られます。
- **ムーブの提出**: プレイヤーは、Kポイント分の「ムーブ」を他のプレイヤーに伏せて提出します。1ポイントにつき，選んだ辺の重みを1増やすか減らすことができます．ポイントを使い切るまで，複数の辺の重みを変更できます．
- **盤面への反映**: 全てのプレイヤーがムーブを提出した後、それらが盤面に反映されます。
- **スコア計算**: 盤面である重み付きグラフの、固有値1の固有ベクトル（マルコフ過程の定常状態）を計算します。固有ベクトルのプレイヤーノードの成分がそのプレイヤーの得点になります。(計算では解の一意性を保証するために、全ての辺の重みに小さな正の値を加えています。)
- **ターン**: 上記のプロセスを S ターン繰り返します。
- **ゲーム終了**: ゲーム終了時に、得点の高い順にランキングが表示されます。

## セットアップとローカル実行

このプロジェクトをローカル環境でセットアップし、実行するための手順です。

### 前提条件

- Node.js (npm)
- Python 3.9+
- pip (Pythonのパッケージインストーラ)

### 1. リポジトリのクローン

```bash
git clone https://github.com/shizuo-kaji/markov-game.git
cd markov-game
```

### 2. バックエンドのセットアップと起動

```bash
cd backend
python3 -m venv venv
source venv/bin/activate  # Windows: .\venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload
```

バックエンドは `http://localhost:8000` で起動します。

### 3. フロントエンドのセットアップと起動

新しいターミナルを開き、プロジェクトのルートディレクトリに戻ってから実行します。

```bash
cd ../frontend
npm run dev
```

フロントエンドは `http://localhost:3000` で起動します。

### 4. ブラウザで開く

ブラウザで以下のURLを開いてゲームを開始します。

```
http://localhost:3000/
```

## Render.com でのデプロイ (推奨)

このプロジェクトは、[Render.com](https://render.com/) を利用して簡単にデプロイできます。フロントエンドは「Static Site」、バックエンドは「Web Service」としてデプロイすることを推奨します。GitHubリポジトリを連携させることで、自動デプロイも設定可能です。

### 1. バックエンドのデプロイ (Web Service)

1.  Renderダッシュボードで「New +」 > 「Web Service」を選択し、このGitHubリポジトリを選択します。
2.  以下の設定を行います。
    - **Root Directory**: `backend`
    - **Environment**: `Python 3`
    - **Build Command**: `pip install -r requirements.txt`
    - **Start Command**: `uvicorn main:app --host 0.0.0.0 --port $PORT`
3.  「Create Web Service」をクリックしてデプロイします。
4.  デプロイが完了したら、発行された `.onrender.com` のURLを控えておきます。

### 2. フロントエンドのデプロイ (Static Site)

1.  Renderダッシュボードで「New +」 > 「Static Site」を選択し、再度このGitHubリポジトリを選択します。
2.  以下の設定を行います。
    - **Root Directory**: `frontend`
    - **Build Command**: `npm install && npm run build`
    - **Publish Directory**: `build`
3.  「Advanced」を開き、環境変数を追加します。
    - **Key**: `REACT_APP_BACKEND_URL`
    - **Value**: 先ほど控えたバックエンドのURL
4.  「Create Static Site」をクリックしてデプロイします。

これで、フロントエンドとバックエンドが連携して動作します。


## AWS デプロイ (少し面倒)

このプロジェクトは、AWS CloudShell を使用して簡単に AWS にデプロイできます。デプロイスクリプトは、フロントエンドを Amazon S3 + CloudFront に、バックエンドを AWS Elastic Beanstalk にデプロイします。

### 前提条件

- AWS CloudShell 環境

### デプロイ手順

1.  **CloudShell を起動**し、プロジェクトのルートディレクトリに移動します。
    ```bash
    git clone https://github.com/shizuo-kaji/markov-game
    cd markov-game
    ```
2.  以下のコマンドでデプロイスクリプトに実行権限を付与します。
    ```bash
    chmod +x deploy_aws.sh
    ```
3.  スクリプトを実行します。
    ```bash
    ./deploy_aws.sh
    ```

スクリプトは、デプロイの進行状況を表示し、完了後にフロントエンドとバックエンドのURLを出力します。デプロイには数分から十数分かかる場合があります。

## AWS リソースのクリーンアップ

デプロイしたAWSリソースを削除するには、クリーンアップスクリプトを使用します。これにより、不要な課金を防ぐことができます。

### クリーンアップ手順

1.  プロジェクトのルートディレクトリにいることを確認します。
2.  以下のコマンドでクリーンアップスクリプトに実行権限を付与します。
    ```bash
    chmod +x cleanup_aws.sh
    ```
3.  スクリプトを実行します。
    ```bash
    ./cleanup_aws.sh
    ```

**注意**: このスクリプトは、`deploy_aws.sh`で作成されたリソースを削除します。実行する際は、削除されるリソースをよく確認してください。
