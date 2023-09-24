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
