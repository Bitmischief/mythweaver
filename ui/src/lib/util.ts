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

export const isProduction = window.location.origin === 'https://app.mythweaver.co';
