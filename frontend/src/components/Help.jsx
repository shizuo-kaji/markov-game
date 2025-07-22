import React from "react";
import ReturnButton from './ReturnButton.jsx';

export default function Help({ onReturn }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
      <div className="p-4 text-left">
      <button className="bg-white rounded text-black shadow-lg p-6 max-w-[500px] w-full text-left"
      onClick={onReturn}>
        <h1 className="
          text-4xl
          p-2 
          font-bold font-serif 
          drop-shadow"
        > Rules: </h1>
        <>
        <ul className="list-disc list-inside space-y-2 text-left text-sm">
          <li><strong>プレイヤー数</strong>: N人で対戦します。</li>
          <li><strong>初期盤面</strong>: N個のプレイヤーノードとM個の非プレイヤーノードが、対称的に適当に連結された重み付きグラフが初期盤面となります。</li>
          <li><strong>ラウンドの進行</strong>: 各ラウンドで、それぞれのプレイヤーには K ポイントが割り振られます。</li>
          <li><strong>ムーブの提出</strong>: プレイヤーは、Kポイント分の「ムーブ」を他のプレイヤーに伏せて提出します。1ポイントにつき，選んだ辺の重みを1増やすか減らすことができます．ポイントを使い切るまで，複数の辺の重みを変更できます。</li>
          <li><strong>盤面への反映</strong>: 全てのプレイヤーがムーブを提出した後、それらが盤面に反映されます。</li>
          <li><strong>スコア計算</strong>: 盤面である重み付きグラフの、固有値1の固有ベクトル（マルコフ過程の定常状態）を計算します。固有ベクトルのプレイヤーノードの成分がそのプレイヤーの得点になります。(解の一意性を保証するために、全ての辺の重みに小さな正の値を加えます。)</li>
          <li><strong>ターン</strong>: 上記のプロセスを S ターン繰り返します。</li>
          <li><strong>ゲーム終了</strong>: ゲーム終了時に、得点の高い順にランキングが表示されます。</li>
        </ul>
        </>
      </button>
      </div>
    </div>
  );
}