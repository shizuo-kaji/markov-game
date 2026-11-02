export const PRESETS = [
  {
    id: "solo",
    title: "まずは1人で",
    tag: "おすすめ",
    description: "あなたとAIの2人。操作と街の流れを、自分のペースで。",
    n: 2,
    m: 2,
    k: 3,
    s: 5,
    ai: [2],
  },
  {
    id: "duo",
    title: "2人で対戦",
    tag: "約10分",
    description: "友達と別々の端末で。予想して、動かして、結果を比べよう。",
    n: 2,
    m: 2,
    k: 3,
    s: 5,
    ai: [],
  },
  {
    id: "class",
    title: "みんなで実験",
    tag: "授業向け",
    description: "3人と2つの公共施設。戦略を話し合うきっかけに。",
    n: 3,
    m: 2,
    k: 3,
    s: 5,
    ai: [],
  },
];
export function presetPayload(preset, name = preset.title) {
  return {
    name,
    num_players_N: preset.n,
    num_non_player_nodes_M: preset.m,
    points_per_round_K: preset.k,
    max_turns_S: preset.s,
    ai_player_positions: preset.ai,
  };
}
export const LAB_NODES = [
  {
    id: "p1",
    name: "あなたの店",
    name_key: "あなたの店",
    kind: "player",
    is_ai: false,
  },
  {
    id: "p2",
    name: "となりの店",
    name_key: "となりの店",
    kind: "player",
    is_ai: true,
  },
  { id: "n1", name: "駅", name_key: "駅", kind: "neutral" },
  { id: "n2", name: "公園", name_key: "公園", kind: "neutral" },
];
