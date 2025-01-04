export function sanitizeJson(json: string): string {
  if (isValidJson(json)) {
    return json;
  }

  const jsonStart = Array.from(json).findIndex((char) => char === '{');
  json = json.slice(jsonStart);
  json = json.replace(/ {4}|[\t\n\r]/gm, ' ');
  json = json.replace('```json', '').replace('```', '');

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
          nextChar !== ',' &&
          nextChar !== '}' &&
          nextChar !== ']' &&
          nextChar !== ':'
        ) {
          fixedCopy = json.slice(0, i) + '\\' + json.slice(i);
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
