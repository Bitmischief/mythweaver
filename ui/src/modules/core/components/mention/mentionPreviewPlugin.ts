import { Editor } from '@tiptap/core';
import { EditorState, Plugin, PluginKey } from '@tiptap/pm/state';
import { EditorView } from '@tiptap/pm/view';
import tippy, { Instance, roundArrow } from 'tippy.js';

export interface MentionPreviewPluginProps {
  /**
   * The plugin key.
   * @type {PluginKey | string}
   * @default 'mentionPreview'
   */
  pluginKey: PluginKey | string;

  /**
   * The editor instance.
   */
  editor: Editor;

  /**
   * The DOM element that contains your menu.
   * @type {HTMLElement}
   * @default null
   */
  element: HTMLElement;
}

export type MentionPreviewViewProps = MentionPreviewPluginProps & {
  view: EditorView;
};

export interface MentionPreviewState {
  mentionId?: string;
}

export class MentionPreviewView {
  public editor: Editor;

  public element: HTMLElement;

  public view: EditorView;

  public preventHide = false;

  public tippy: Instance | undefined;

  public updateDelay: number;

  private updateDebounceTimer: number | undefined;

  private state: MentionPreviewState = {};

  constructor({ editor, element, view, updateDelay = 250 }: MentionPreviewViewProps) {
    this.editor = editor;
    this.element = element;
    this.view = view;
    this.updateDelay = updateDelay;

    this.element.addEventListener('mousedown', this.mousedownHandler, { capture: true });
    this.view.dom.addEventListener('dragstart', this.dragstartHandler);
    this.editor.on('blur', this.blurHandler);
    this.editor.on('selectionUpdate', this.selectionUpdateHandler);

    // Detaches menu content from its current parent
    this.element.remove();
    this.element.style.visibility = 'visible';

    // Add click listeners to mention elements
    this.addMentionClickListeners();
  }

  private addMentionClickListeners = () => {
    const mentions = this.view.dom.querySelectorAll('[data-type="mention"]');
    mentions.forEach((mention: Element) => {
      mention.addEventListener('click', this.mentionClickHandler as EventListener);
    });
  };

  private mentionClickHandler = (event: MouseEvent) => {
    console.log('mentionClickHandler');
    this.hide();

    this.createTooltip();

    const mentionElement = event.currentTarget as HTMLElement;
    const mentionId = mentionElement.getAttribute('data-id');
    this.state.mentionId = mentionId ?? undefined;

    const content = this.tippy?.popper.querySelector('[data-mention-preview]');
    if (content instanceof HTMLElement) {
      content.dataset.currentMentionId = mentionId ?? '';
    }

    this.tippy?.setProps({
      getReferenceClientRect: () => mentionElement.getBoundingClientRect(),
      appendTo: () => document.body,
      content: this.element,
      showOnCreate: true,
      interactive: true,
      trigger: 'manual',
      placement: 'top',
      hideOnClick: false,
      arrow: roundArrow,
    });

    console.log('tippy', this.tippy);

    this.show();
  };

  selectionUpdateHandler = () => {
    this.hide();
  };

  mousedownHandler = () => {
    this.preventHide = true;
  };

  dragstartHandler = () => {
    this.hide();
  };

  blurHandler = ({ event }: { event: FocusEvent }) => {
    if (this.preventHide) {
      this.preventHide = false;

      return;
    }

    if (event?.relatedTarget && this.element.parentNode?.contains(event.relatedTarget as Node)) {
      return;
    }

    if (event?.relatedTarget === this.editor.view.dom) {
      return;
    }

    this.hide();
  };

  tippyBlurHandler = (event: FocusEvent) => {
    this.blurHandler({ event });
  };

  createTooltip() {
    console.log('createTooltip');
    const { element: editorElement } = this.editor.options;
    const editorIsAttached = !!editorElement.parentElement;

    if (this.tippy || !editorIsAttached) {
      return;
    }

    this.tippy = tippy(editorElement, {
      getReferenceClientRect: () => this.element.getBoundingClientRect(),
      appendTo: () => document.body,
      content: this.element,
      showOnCreate: true,
      interactive: true,
      trigger: 'manual',
      placement: 'top',
      hideOnClick: false,
      arrow: roundArrow,
    });

    console.log('tippy in createTooltip', this.tippy);

    // maybe we have to hide tippy on its own blur event as well
    if (this.tippy.popper.firstChild) {
      (this.tippy.popper.firstChild as HTMLElement).addEventListener('blur', this.tippyBlurHandler);
    }
  }

  update(view: EditorView, oldState?: EditorState) {
    if (this.updateDelay > 0) {
      this.handleDebouncedUpdate(view, oldState);
      return;
    }

    const docChanged = !oldState?.doc.eq(view.state.doc);

    // Re-add click listeners when document changes
    if (docChanged) {
      this.addMentionClickListeners();
    }

    this.updateHandler(view, docChanged);
  }

  handleDebouncedUpdate = (view: EditorView, oldState?: EditorState) => {
    const docChanged = !oldState?.doc.eq(view.state.doc);

    if (!docChanged) {
      return;
    }

    if (this.updateDebounceTimer) {
      clearTimeout(this.updateDebounceTimer);
    }

    this.updateDebounceTimer = window.setTimeout(() => {
      this.updateHandler(view, docChanged);
    }, this.updateDelay);
  };

  updateHandler = (view: EditorView, docChanged: boolean) => {
    console.log('updateHandler');
    const { composing } = view;

    const isSame = !docChanged;

    if (composing || isSame) {
      return;
    }

    this.hide();

    this.createTooltip();

    this.addMentionClickListeners();
  };

  show() {
    this.tippy?.setProps({
      zIndex: 99999,
    });
  }

  hide() {
    this.tippy?.setProps({
      zIndex: -1,
    });
  }

  destroy() {
    if (this.tippy?.popper.firstChild) {
      (this.tippy.popper.firstChild as HTMLElement).removeEventListener(
        'blur',
        this.tippyBlurHandler,
      );
    }
    this.tippy?.destroy();
    this.element.removeEventListener('mousedown', this.mousedownHandler, { capture: true });
    this.view.dom.removeEventListener('dragstart', this.dragstartHandler);
    this.editor.off('blur', this.blurHandler);

    // Remove click listeners from mention elements
    const mentions = this.view.dom.querySelectorAll('[data-type="mention"]');
    mentions.forEach((mention) => {
      mention.removeEventListener('click', this.mentionClickHandler as EventListener);
    });
  }
}

export const MentionPreviewPlugin = (options: MentionPreviewPluginProps) => {
  return new Plugin({
    key:
      typeof options.pluginKey === 'string' ? new PluginKey(options.pluginKey) : options.pluginKey,
    view: (view) => new MentionPreviewView({ view, ...options }),
  });
};
