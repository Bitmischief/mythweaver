import { postGenerateArbitraryFromPrompt } from '@/api/generators';
import { showError } from '@/lib/notifications';

export default class GenerationBlock {
  constructor({ data, readOnly, api, config, block }) {
    this.data = data;
    this.readOnly = readOnly;
    this.api = api;
    this.context = config.context;
    this.block = block;
  }

  static get isReadOnlySupported() {
    return true;
  }

  static get toolbox() {
    return {
      title: 'AI Generated Text',
      icon: '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-6 h-6"><path stroke-linecap="round" stroke-linejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 0 0-2.456 2.456ZM16.894 20.567 16.5 21.75l-.394-1.183a2.25 2.25 0 0 0-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 0 0 1.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 0 0 1.423 1.423l1.183.394-1.183.394a2.25 2.25 0 0 0-1.423 1.423Z" /></svg>',
    };
  }

  render() {
    this.wrapper = document.createElement('div');
    this.wrapper.classList.add('ce-block__generation', 'py-2');

    if (this.readOnly) {
      const roLabel = document.createElement('div');
      roLabel.classList.add('text-neutral-400', 'underline', 'text-lg');
      roLabel.innerHTML =
        this.data && this.data.label ? this.data.label : 'Label';
      this.wrapper.appendChild(roLabel);

      const roValue = document.createElement('div');
      roValue.classList.add('text-neutral-100', 'whitespace-pre-wrap');
      roValue.innerHTML = this.data && this.data.text ? this.data.text : 'Text';
      this.wrapper.appendChild(roValue);
    } else {
      const promptWrapper = document.createElement('div');
      promptWrapper.classList.add('flex');

      this.prompt = document.createElement('input');
      this.prompt.className = 'ce-block__generation__prompt';
      this.prompt.disabled = this.readOnly;
      this.prompt.value = this.data && this.data.prompt ? this.data.prompt : '';
      this.prompt.placeholder =
        'Prompt (ex. generate a random side quest for my next session)';
      this.prompt.classList.add('grow');
      this.prompt.style.borderRadius = '12px 0 0 12px';
      promptWrapper.appendChild(this.prompt);

      this.label = document.createElement('div');
      this.label.className = 'ce-block__generation__label';
      this.label.contentEditable = !this.readOnly;
      this.label.innerHTML =
        this.data && this.data.label ? this.data.label : '';

      this.label.style.borderRadius = '12px';
      this.label.style.border = '1px solid #6b7280';
      this.label.style.padding = '6px 12px';
      this.label.style.marginTop = '0.5em';
      this.label.dataset.placeholder = 'Label';

      this.input = document.createElement('div');
      this.input.className = 'ce-block__generation__input';
      this.input.contentEditable = !this.readOnly;
      this.input.innerHTML = this.data && this.data.text ? this.data.text : '';

      this.input.style.borderRadius = '12px';
      this.input.style.border = '1px solid #6b7280';
      this.input.style.padding = '6px 12px';
      this.input.style.marginTop = '0.5em';
      this.input.style.whiteSpace = 'pre-wrap';
      this.input.dataset.placeholder = 'Text';

      this.button = document.createElement('button');
      this.button.classList.add('button-gradient', 'flex', 'gap-2', 'pt-3');
      this.button.style.borderRadius = '0 12px 12px 0';
      this.button.style.whiteSpace = 'nowrap';
      this.button.innerHTML = this.input.innerHTML ? 'Re-generate' : 'Generate';
      this.button.addEventListener('click', async () => {
        await this._generateText();
      });

      promptWrapper.appendChild(this.button);

      this.wrapper.appendChild(promptWrapper);
      this.wrapper.appendChild(this.label);
      this.wrapper.appendChild(this.input);
    }

    return this.wrapper;
  }

  async _generateText() {
    let background = {};
    const count = this.api.blocks.getBlocksCount();
    for (let i = 0; i < count; i++) {
      const block = this.api.blocks.getBlockByIndex(i);
      if (this.block.id !== block.id) {
        const value = await block.save();
        if (value.tool === 'generationBlock' || value.tool === 'paragraph') {
          background[`${this.context}_notes_${i}`] = value.data;
        }
      }
    }

    if (this.prompt.value) {
      this.button.disabled = true;
      this.prompt.disabled = true;
      this.input.contentEditable = false;
      this.label.contentEditable = false;
      const originalButtonText = this.button.innerHTML;
      this.button.innerHTML =
        'Generating <svg class="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>';

      try {
        const response = await postGenerateArbitraryFromPrompt({
          background: background,
          context: this.context,
          prompt: this.prompt.value,
        });
        this.label.innerHTML = response.data.label
          ? response.data.label
          : 'Unable to generate label';
        this.input.innerHTML = response.data.text
          ? response.data.text
          : 'Unable to generate text, please try again with a more descriptive attribute name.';
        this.button.innerHTML = 'Re-generate';
      } catch {
        this.button.innerHTML = originalButtonText;
        await showError({ message: 'Something went wrong, please try again.' });
      } finally {
        this.button.disabled = false;
        this.prompt.disabled = false;
        this.input.contentEditable = true;
        this.label.contentEditable = true;
      }
    }
  }

  save(blockContent) {
    const prompt = blockContent.querySelector(
      'input.ce-block__generation__prompt',
    );
    const label = blockContent.querySelector('div.ce-block__generation__label');
    const text = blockContent.querySelector('div.ce-block__generation__input');

    return {
      prompt: prompt.value,
      label: label.innerHTML,
      text: text.innerHTML,
    };
  }
}
