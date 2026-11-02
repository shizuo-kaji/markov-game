import test from "node:test";
import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import {
  initialLanguage,
  translate,
  localizeRoom,
  createTranslator,
} from "../src/i18n/core.js";
import en from "../src/i18n/en.js";

test("explicit language choice wins; browser languages select a supported fallback", () => {
  assert.equal(initialLanguage("ja", ["en-US"]), "ja");
  assert.equal(initialLanguage("en", ["ja-JP"]), "en");
  assert.equal(initialLanguage(null, ["en-US"]), "en");
  assert.equal(initialLanguage("unsupported", ["fr", "ja-JP"]), "ja");
  assert.equal(initialLanguage(null, ["fr"]), "ja");
});

test("translations interpolate whole sentences without translating user names", () => {
  assert.equal(
    translate("en", "{0}が、いちばん人気の店に。", ["駅"]),
    "駅 is the most popular shop!",
  );
  assert.equal(translate("ja", "{0}に全員", ["公園"]), "公園に全員");
  assert.equal(translate("en", "{0}に全員", ["Park"]), "Everyone at Park");
  assert.equal(
    translate("en", { key: "予想は「{0}」。", values: [{ key: "増える" }] }),
    "Your prediction: Increase. ",
  );
});

test("only explicitly marked default node names change language; game data stays intact", () => {
  const original = {
    name: "私たちの街",
    matrix: [
      [1, 2],
      [3, 4],
    ],
    scores: [0.4, 0.6],
    nodes: [
      { id: "p1", name: "プレイヤー 1", name_key: "player" },
      { id: "n1", name: "駅", name_key: "駅" },
    ],
    players: [{ id: "p1", name: "駅" }],
  };
  const room = localizeRoom(original, createTranslator("en"));
  assert.equal(room.name, original.name);
  assert.equal(room.nodes[0].name, "Player 1");
  assert.equal(room.nodes[1].name, "Station");
  assert.equal(room.players[0].name, "駅");
  assert.equal(original.nodes[0].name, "プレイヤー 1");
  assert.equal(room.matrix, original.matrix);
  assert.equal(room.scores, original.scores);
  assert.equal(localizeRoom(null, createTranslator("ja")), null);
});

test("English messages preserve every interpolation placeholder", () => {
  const slots = (value) =>
    [...value.matchAll(/\{\d+\}/g)].map((match) => match[0]).sort();
  for (const [key, value] of Object.entries(en)) {
    assert.deepEqual(slots(value), slots(key), key);
  }
});

test("all literal UI translation keys have English messages", () => {
  const source = new URL("../src/", import.meta.url);
  for (const file of readdirSync(source, { recursive: true }).filter((file) =>
    file.endsWith(".jsx"),
  )) {
    const content = readFileSync(new URL(file, source), "utf8");
    for (const match of content.matchAll(/\bt\(\s*("(?:[^"\\]|\\.)*")/g)) {
      const key = JSON.parse(match[1]);
      assert.ok(
        Object.hasOwn(en, key),
        `${file}: missing English translation: ${key}`,
      );
    }
  }
});
