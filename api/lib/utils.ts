export function shuffle<T>(array: T[]): T[] {
  let currentIndex = array.length,  randomIndex;

  // While there remain elements to shuffle.
  while (currentIndex != 0) {

    // Pick a remaining element.
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex--;

    // And swap it with the current element.
    [array[currentIndex], array[randomIndex]] = [
      array[randomIndex], array[currentIndex]];
  }

  return array;
}

export function sanitizeJson(json: string): string {
  const jsonStart = Array.from(json).findIndex((char) => char === '{');
  json = json.slice(jsonStart);
  json = json.replace(/ {4}|[\t\n\r]/gm,'');

  //escape unescaped quotes in json
  let quotesOpen = false;
  let fixedCopy = `${json}`;

  for(let i = 0; i < json.length; i++) {
    const char = json[i];

    if (char === '"') {
      quotesOpen = !quotesOpen;

      if (!quotesOpen) {
        const nextChar = json[i+1];

        if (nextChar !== ',' && nextChar !== '}' && nextChar !== ']' && nextChar !== ':') {
          fixedCopy = json.slice(0, i) + '\\' + json.slice(i);
          quotesOpen = true;
        }

        const ref = json.slice(i);
      }
    }
  }

  return fixedCopy;
}

