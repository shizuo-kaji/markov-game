import en from "./en.js";

export const LANGUAGE_KEY = "markov-town:language";
export function initialLanguage(saved, languages = []) {
  if (saved === "ja" || saved === "en") return saved;
  return (
    languages
      .map((language) => language.toLowerCase().split("-")[0])
      .find((language) => language === "ja" || language === "en") || "ja"
  );
}

export function translate(language, message, values = []) {
  if (message && typeof message === "object") {
    return translate(language, message.key, message.values);
  }
  if (typeof message !== "string") return "";
  const text =
    language === "en" && Object.hasOwn(en, message) ? en[message] : message;
  return text.replace(/\{(\d+)\}/g, (placeholder, index) => {
    const value = values?.[index];
    if (value === undefined) return placeholder;
    return value && typeof value === "object"
      ? translate(language, value)
      : String(value);
  });
}
export const createTranslator = (language) => (message, values) =>
  translate(language, message, values);

// Only names explicitly marked as defaults are translated. User-entered names stay intact.
export function localizeNodes(nodes, t) {
  return nodes.map((node) => ({
    ...node,
    name:
      node.name_key === "player"
        ? t("プレイヤー {0}", [node.id.slice(1)])
        : node.name_key
          ? t(node.name_key)
          : node.name,
  }));
}
export function localizeRoom(room, t) {
  if (!room) return null;
  return {
    ...room,
    nodes: localizeNodes(room.nodes, t),
    players: localizeNodes(room.players, t),
  };
}
