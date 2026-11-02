import { useI18n } from "../i18n/useI18n.js";
import { useState } from "react";
import { PRESETS, presetPayload } from "../utils/presets.js";
import Icon from "./Icon.jsx";
export default function RoomForm({ onCreate, busy, presetId = "solo" }) {
  const { t } = useI18n();
  const initial =
    PRESETS.find((preset) => preset.id === presetId) || PRESETS[0];
  const [selected, setSelected] = useState(initial.id);
  const [settings, setSettings] = useState(presetPayload(initial));
  const [nameEdited, setNameEdited] = useState(false);
  const roomName = nameEdited ? settings.name : t(settings.name);
  const setValue = (key, value) => {
    setSelected("custom");
    setSettings((current) => ({
      ...current,
      [key]: value,
      ...(key === "num_players_N"
        ? {
            ai_player_positions: current.ai_player_positions.filter(
              (i) => i <= value,
            ),
          }
        : {}),
    }));
  };
  const invalid =
    settings.num_players_N + settings.num_non_player_nodes_M > 10 ||
    settings.num_players_N + settings.num_non_player_nodes_M < 2 ||
    settings.ai_player_positions.length >= settings.num_players_N;
  return (
    <div className="page narrow-page">
      <a className="back-link" href="#home">
        <Icon name="back" size={16} />
        {t("ホームに戻る")}
      </a>
      <span className="eyebrow">MAKE YOUR TOWN</span>
      <h1>{t("どんな街で遊ぼう？")}</h1>
      <p className="lead">
        {t("はじめてなら、おすすめの設定でそのまま始められます。")}
      </p>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          if (!invalid) onCreate({ ...settings, name: roomName });
        }}
      >
        <fieldset disabled={busy} className="form-fieldset">
          <div className="preset-options">
            {PRESETS.map((preset) => (
              <button
                type="button"
                key={preset.id}
                className={`preset-option ${selected === preset.id ? "selected" : ""}`}
                onClick={() => {
                  setSelected(preset.id);
                  setSettings(presetPayload(preset));
                  setNameEdited(false);
                }}
              >
                <strong>{t(preset.title)}</strong>
                <span>
                  {t("{0}人 · 中立{1} · {2}pt · {3}ラウンド", [
                    preset.n,
                    preset.m,
                    preset.k,
                    preset.s,
                  ])}
                </span>
              </button>
            ))}
          </div>
          <div className="panel form-panel">
            <label className="field">
              {t("ルームの名前")}
              <input
                autoComplete="off"
                maxLength={40}
                required
                value={roomName}
                onChange={(e) => {
                  setNameEdited(true);
                  setSettings({ ...settings, name: e.target.value });
                }}
              />
            </label>
            <div className="number-fields">
              {[
                ["num_players_N", t("プレイヤー"), t("人"), 1, 6],
                [
                  "num_non_player_nodes_M",
                  t("公共施設（中立）"),
                  t("点"),
                  0,
                  6,
                ],
                ["points_per_round_K", t("1ラウンドのポイント"), "pt", 1, 20],
                ["max_turns_S", t("ラウンド"), t("回"), 1, 12],
              ].map(([key, label, unit, min, max]) => (
                <label className="field" key={key}>
                  {label}
                  <div className="number-control">
                    <button
                      type="button"
                      aria-label={t("{0}を減らす", [label])}
                      disabled={settings[key] <= min}
                      onClick={() => setValue(key, settings[key] - 1)}
                    >
                      −
                    </button>
                    <input
                      aria-label={label}
                      type="number"
                      min={min}
                      max={max}
                      required
                      value={settings[key]}
                      onChange={(e) =>
                        setValue(
                          key,
                          e.target.value === ""
                            ? ""
                            : Math.max(
                                min,
                                Math.min(max, Number(e.target.value)),
                              ),
                        )
                      }
                    />
                    <span>{unit}</span>
                    <button
                      type="button"
                      aria-label={t("{0}を増やす", [label])}
                      disabled={settings[key] >= max}
                      onClick={() => setValue(key, settings[key] + 1)}
                    >
                      +
                    </button>
                  </div>
                </label>
              ))}
            </div>
            <div className="callout">
              <Icon name="spark" />
              <p>
                <strong>
                  {t("おすすめは、2人・中立2点・3ポイント・5ラウンド。")}
                </strong>
                <br />
                {t(
                  "辺の変化を追いやすく、少ない操作で結果を比較できます。今回の入門用設定です。",
                )}
              </p>
            </div>
            <div>
              <h3>{t("コンピューターに任せる席")}</h3>
              <p className="muted">
                {t("1人で遊ぶ場合は、プレイヤー2をAIにします。")}
              </p>
              <div className="ai-options">
                {Array.from(
                  {
                    length: settings.num_players_N,
                  },
                  (_, i) => (
                    <label key={i}>
                      <input
                        type="checkbox"
                        checked={settings.ai_player_positions.includes(i + 1)}
                        onChange={(event) =>
                          setValue(
                            "ai_player_positions",
                            event.target.checked
                              ? [...settings.ai_player_positions, i + 1]
                              : settings.ai_player_positions.filter(
                                  (p) => p !== i + 1,
                                ),
                          )
                        }
                      />
                      {t("プレイヤー {0}", [i + 1])}
                    </label>
                  ),
                )}
              </div>
            </div>
            {invalid && (
              <p role="alert" className="error-text">
                {t(
                  "ノードは合計2〜10個、人間のプレイヤーは1人以上にしてください。",
                )}
              </p>
            )}
            <button
              className="button primary full"
              disabled={invalid || busy || !settings.name.trim()}
            >
              {busy ? t("街を準備しています…") : t("ルームを作って進む")}
              <Icon name="arrow" />
            </button>
          </div>
        </fieldset>
      </form>
      <p className="fine-print">
        {t(
          "ルームはサーバーのメモリに保存され、サーバー再起動でリセットされます。結果は終了時にダウンロードできます。",
        )}
      </p>
    </div>
  );
}
