export function shuffleArray(array: any[]) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const temp = array[i];
    array[i] = array[j];
    array[j] = temp;
  }

  return array;
}

export function trimPlural(s: string | undefined): string | undefined {
  if (!s) return;

  if (s.endsWith('s')) {
    return s.slice(0, -1);
  }

  return s;
}

export function autoGrowTextArea(evt: FocusEvent | KeyboardEvent) {
  const textArea = evt.target as HTMLTextAreaElement;

  if (!textArea) return;

  textArea.style.height = 'auto';
  textArea.style.height = textArea.scrollHeight + 1 + 'px';
}

export function waitUntil(condition: () => boolean, timeout = 10000): Promise<void> {
  return new Promise((resolve, reject) => {
    const start = Date.now();

    const interval = setInterval(() => {
      if (condition()) {
        clearInterval(interval);
        resolve();
      } else if (Date.now() - start > timeout) {
        clearInterval(interval);
        reject(new Error('Timeout waiting for condition'));
      }
    }, 100);
  });
}

export function toPascalCase(text: string): string {
  const words = text.split(/\s+/);

  const pascalCaseWords = words.map((word) => {
    return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
  });

  return pascalCaseWords.join('');
}

export const isProduction = window.location.origin === 'https://app.mythweaver.co';
export const isDevelopment = window.location.origin === 'https://dev-app.mythweaver.co';
export const isLocalDevelopment = window.location.origin === 'http://localhost:3000';

export function toTitleCase(str: string) {
  return str
    .match(/[A-Z]{2,}(?=[A-Z][a-z]+[0-9]*|\b)|[A-Z]?[a-z]+[0-9]*|[A-Z]|[0-9]+/g)
    ?.map((x) => x.charAt(0).toUpperCase() + x.slice(1))
    .join(' ');
}

export function mapConjurationType(conjurerCode: string) {
  switch (conjurerCode) {
    case 'monsters':
      return 'Monster';
    case 'locations':
      return 'Location';
    case 'characters':
      return 'NPC';
    case 'items':
      return 'Magic Item';
    case 'vehicles':
      return 'Vehicle';
    case 'creatures':
      return 'Creature';
    case 'players':
      return 'Characters';
    default:
      return '';
  }
}
