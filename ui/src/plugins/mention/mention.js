import { sleep } from '@/lib/util';
import './mention.css';

export default class MentionTool {
  constructor({ api, config }) {
    this.api = api;
    this.config = config;
    this.form = null; // Will be set in afterInit
    this.button = null;
    this.state = false;
    this.users = config.users || [];
    this._handleKeydown = this._handleKeydown.bind(this);

    sleep(250).then(() => {
      this.afterInit();
    });
  }

  render() {
    this.button = document.createElement('button');
    this.button.type = 'button';
    this.button.textContent = '@';
    this.button.classList.add('ce-inline-tool');
    return this.button;
  }

  afterInit() {
    this.form = document.getElementsByClassName('codex-editor')[0];
    this.api.listeners.on(this.form, 'keydown', this._handleKeydown, false);
  }

  _handleKeydown(event) {
    if (event.key === '@') {
      setTimeout(() => this.checkForMention(), 0);
    } else if (this.isSuggestionsVisible()) {
      this.handleSuggestionNavigation(event);
    }
  }

  checkForMention() {
    const selection = window.getSelection();
    const range = selection.getRangeAt(0);
    const currentBlockIndex = this.api.blocks.getCurrentBlockIndex();
    const currentBlock = this.api.blocks.getBlockByIndex(currentBlockIndex);
    if (!currentBlock) return;

    const blockContent = currentBlock.holder.textContent;
    const cursorPosition = range.startOffset;
    const textBeforeCursor = blockContent.slice(0, cursorPosition);

    const lastAtSymbolIndex = textBeforeCursor.lastIndexOf('@');

    if (lastAtSymbolIndex !== -1) {
      const query = textBeforeCursor.slice(lastAtSymbolIndex + 1);
      this.showSuggestions(query);
    } else {
      this.hideSuggestions();
    }
  }

  showSuggestions(query) {
    this.hideSuggestions(); // Remove existing popup if any

    const popup = document.createElement('div');
    popup.classList.add('mention-suggestions');

    const filteredUsers = this.users.filter((user) =>
      user.name.toLowerCase().includes(query.toLowerCase()),
    );

    filteredUsers.forEach((user, index) => {
      const suggestion = document.createElement('div');
      suggestion.textContent = user.name;
      suggestion.dataset.index = index;
      suggestion.addEventListener('click', () => this.selectUser(user));
      popup.appendChild(suggestion);
    });

    if (filteredUsers.length === 0) {
      this.hideSuggestions();
      return;
    }

    this.form.appendChild(popup);
    this.positionPopup(popup);
  }

  positionPopup(popup) {
    const selection = window.getSelection();
    const range = selection.getRangeAt(0);
    const rect = range.getBoundingClientRect();
    const formRect = this.form.getBoundingClientRect();

    const adjustmentPixels = -25;

    popup.style.position = 'absolute';
    popup.style.left = `${rect.left - formRect.left}px`;
    popup.style.top = `${rect.bottom - formRect.top + adjustmentPixels}px`; // 5px below the cursor

    // Adjust for right edge
    if (rect.left + popup.offsetWidth > formRect.right) {
      popup.style.left = `${formRect.right - popup.offsetWidth - formRect.left}px`;
    }

    // Adjust for bottom edge
    if (rect.bottom + popup.offsetHeight > formRect.bottom) {
      popup.style.top = `${rect.top - formRect.top - popup.offsetHeight - adjustmentPixels}px`; // 5px above the cursor
    }
  }

  hideSuggestions() {
    const popup = this.form.querySelector('.mention-suggestions');
    if (popup) popup.remove();
  }

  isSuggestionsVisible() {
    return !!this.form.querySelector('.mention-suggestions');
  }

  handleSuggestionNavigation(event) {
    const popup = this.form.querySelector('.mention-suggestions');
    const suggestions = popup.querySelectorAll('div');
    const currentIndex = Array.from(suggestions).findIndex((el) =>
      el.classList.contains('selected'),
    );

    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        this.selectSuggestion(
          currentIndex + 1 >= suggestions.length ? 0 : currentIndex + 1,
        );
        break;
      case 'ArrowUp':
        event.preventDefault();
        this.selectSuggestion(
          currentIndex - 1 < 0 ? suggestions.length - 1 : currentIndex - 1,
        );
        break;
      case 'Enter':
        event.preventDefault();
        if (currentIndex !== -1) {
          const selectedUser =
            this.users[parseInt(suggestions[currentIndex].dataset.index)];
          this.selectUser(selectedUser);
        }
        break;
      case 'Escape':
        this.hideSuggestions();
        break;
    }
  }

  selectSuggestion(index) {
    const popup = this.form.querySelector('.mention-suggestions');
    const suggestions = popup.querySelectorAll('div');
    suggestions.forEach((el, i) => {
      if (i === index) el.classList.add('selected');
      else el.classList.remove('selected');
    });
  }

  selectUser(user) {
    const mention = `@${user.name}`;
    this.api.selection.insertHTML(
      `<span class="mention" data-user-id="${user.id}">${mention}</span>&nbsp;`,
    );
    this.hideSuggestions();
  }

  destroy() {
    this.api.listeners.off(this.form, 'keydown', this._handleKeydown);
    this.hideSuggestions();
  }

  static get sanitize() {
    return {
      span: {
        class: 'mention',
        'data-user-id': true,
      },
    };
  }
}
