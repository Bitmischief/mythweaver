import { parentLogger } from "./logger";

const logger = parentLogger.getSubLogger();

export function shuffle<T>(array: T[]): T[] {
  let currentIndex = array.length,
    randomIndex;

  // While there remain elements to shuffle.
  while (currentIndex != 0) {
    // Pick a remaining element.
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex--;

    // And swap it with the current element.
    [array[currentIndex], array[randomIndex]] = [
      array[randomIndex],
      array[currentIndex],
    ];
  }

  return array;
}

export function sanitizeJson(json: string): string {
  if (isValidJson(json)) {
    return json;
  }

  logger.info("Json was invalid, attempting to clean...");

  const jsonStart = Array.from(json).findIndex((char) => char === "{");
  json = json.slice(jsonStart);
  json = json.replace(/ {4}|[\t\n\r]/gm, " ");

  if (isValidJson(json)) {
    return json;
  }

  //escape unescaped quotes in json
  let quotesOpen = false;
  let fixedCopy = `${json}`;

  for (let i = 0; i < json.length; i++) {
    const char = json[i];

    if (char === '"') {
      quotesOpen = !quotesOpen;

      if (!quotesOpen) {
        const nextChar = json[i + 1];

        if (
          nextChar !== "," &&
          nextChar !== "}" &&
          nextChar !== "]" &&
          nextChar !== ":"
        ) {
          fixedCopy = json.slice(0, i) + "\\" + json.slice(i);
          quotesOpen = true;
        }
      }
    }
  }

  return fixedCopy;
}

export function isValidJson(json: string): boolean {
  try {
    JSON.parse(json);
    return true;
  } catch (err) {
    return false;
  }
}

export function trimPlural(s: string | undefined): string | undefined {
  if (!s) return;

  if (s.endsWith("s")) {
    return s.slice(0, -1);
  }

  return s;
}
