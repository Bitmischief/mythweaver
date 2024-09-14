<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import EditorJs from '@editorjs/editorjs'; // @ts-ignore
import Header from '@editorjs/header'; // @ts-ignore
import NestedList from '@editorjs/nested-list'; // @ts-ignore
import Delimiter from '@editorjs/delimiter'; // @ts-ignore
import Checklist from '@editorjs/checklist'; // @ts-ignore
import Table from '@editorjs/table'; // @ts-ignore
import Paragraph from '@editorjs/paragraph'; // @ts-ignore
import DragDrop from 'editorjs-drag-drop'; // @ts-ignore
import Undo from 'editorjs-undo'; // @ts-ignore
import MermaidTool from 'editorjs-mermaid'; // @ts-ignore
import Marker from '@editorjs/marker'; // @ts-ignore
import Strikethrough from '@sotaproject/strikethrough'; // @ts-ignore
import Underline from '@editorjs/underline'; // @ts-ignore
import AlignmentTuneTool from 'editorjs-text-alignment-blocktune'; // @ts-ignore
import GenerationBlock from '@/plugins/generation-block/generation-block'; // @ts-ignore
import InlineGeneration from '@/plugins/inline-generation/inline-generation'; // @ts-ignore
import MentionTool from '@/plugins/mention/mention';

const showInlineTextGeneration = ref(true);
const emit = defineEmits(['update:modelValue']);
const props = withDefaults(
  defineProps<{
    modelValue: any;
    readOnly?: boolean;
    context?: string;
    placeholder?: string;
    unsavedChanges?: boolean;
    editable?: boolean;
  }>(),
  {
    readOnly: false,
    context: 'session',
    placeholder: 'Start planning your session here...',
    unsavedChanges: false,
    editable: false,
  },
);

const editor = ref<EditorJs>();
const editorReady = ref(props.readOnly ?? false);
const value = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value),
});

onMounted(() => {
  let tools = {} as any;

  if (showInlineTextGeneration.value) {
    tools.generationBlock = {
      class: GenerationBlock,
      shortcut: 'ALT+A',
      config: {
        context: props.context,
      },
      inlineToolbar: true,
    };
    tools.Regenerate = {
      class: InlineGeneration,
      shortcut: 'ALT+G',
      inlineToolbar: true,
      config: {
        context: props.context,
      },
    };
  }

  tools = {
    ...tools,
    mention: {
      class: MentionTool,
      shortcut: '@', // triggers the mention dialog
      inlineToolbar: true,
      config: {
        users: [
          {
            name: 'Austin Zurfluh',
          },
        ],
      },
    },
    marker: {
      class: Marker,
      shortcut: 'ALT+M',
      inlineToolbar: true,
    },
    strikethrough: {
      class: Strikethrough,
      shortcut: 'ALT+S',
      inlineToolbar: true,
    },
    underline: {
      class: Underline,
      shortcut: 'ALT+U',
      inlineToolbar: true,
    },
    header: {
      class: Header,
      shortcut: 'ALT+H',
      inlineToolbar: true,
    },
    paragraph: {
      class: Paragraph,
      inlineToolbar: true,
      tunes: ['anyTuneName'],
    },
    nestedList: {
      class: NestedList,
      shortcut: 'ALT+B',
      toolbox: {
        title: 'Bullet List',
        icon: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24"><line x1="9" x2="19" y1="7" y2="7" stroke="currentColor" stroke-linecap="round" stroke-width="2"></line><line x1="9" x2="19" y1="12" y2="12" stroke="currentColor" stroke-linecap="round" stroke-width="2"></line><line x1="9" x2="19" y1="17" y2="17" stroke="currentColor" stroke-linecap="round" stroke-width="2"></line><path stroke="currentColor" stroke-linecap="round" stroke-width="2" d="M5.00001 17H4.99002"></path><path stroke="currentColor" stroke-linecap="round" stroke-width="2" d="M5.00001 12H4.99002"></path><path stroke="currentColor" stroke-linecap="round" stroke-width="2" d="M5.00001 7H4.99002"></path></svg>',
      },
      config: {
        defaultStyle: 'unordered',
      },
      inlineToolbar: true,
    },
    orderedList: {
      class: NestedList,
      shortcut: 'ALT+N',
      toolbox: {
        title: 'Numbered List',
      },
      config: {
        defaultStyle: 'ordered',
      },
      inlineToolbar: true,
    },
    checklist: {
      class: Checklist,
      shortcut: 'ALT+C',
      inlineToolbar: true,
    },
    table: {
      class: Table,
      shortcut: 'ALT+T',
      inlineToolbar: true,
    },
    mermaid: {
      class: MermaidTool,
      shortcut: 'ALT+F',
      toolbox: {
        title: 'Flowchart',
        icon: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24"><path d="M3 3h18v18H3V3zm4 4v10h10V7H7z" fill="currentColor"></path></svg>',
      },
    },
    delimiter: {
      class: Delimiter,
      shortcut: 'ALT+D',
    },
    anyTuneName: {
      class: AlignmentTuneTool,
      config: {
        default: 'left',
        blocks: {
          header: 'center',
          list: 'right',
        },
      },
    },
  };

  const e = new EditorJs({
    holder: 'editor',
    placeholder: props.placeholder,
    data: value.value,
    minHeight: 100,
    autofocus: false,
    defaultBlock: 'paragraph',
    readOnly: props.readOnly,
    onChange: () => {
      if (editor.value && editorReady.value && !props.readOnly) {
        editor.value.save().then((outputData) => {
          value.value = outputData;
        });
      }
    },
    onReady: () => {
      editorReady.value = true;
      const undo = new Undo({ editor: e });
      if (props.modelValue) {
        undo.initialize(props.modelValue.blocks);
      }
      new DragDrop(e);
      MermaidTool.config({ theme: 'dark' });
    },
    tools: tools,
  });
  editor.value = e;
});
</script>

<template>
  <div class="rounded-[12px] bg-surface-2 w-full py-4">
    <div class="flex justify-end text-sm text-neutral-500 px-6">
      <div v-if="readOnly && editable">
        Read Mode
        <span class="hidden md:inline">(double click to edit)</span>
        <span class="inline md:hidden">(click "edit" to make changes)</span>
      </div>
      <div v-if="unsavedChanges" class="">Unsaved Changes</div>
    </div>
    <div id="editor" class="w-full"></div>
  </div>
</template>

<style lang="scss">
#editor {
  h1,
  h2,
  h3,
  h4,
  h5,
  h6 {
    font-size: revert;
  }

  .ce-toolbar__plus,
  .ce-toolbar__settings-btn {
    color: #e5e7eb;
    background: #1e202a;

    &:hover {
      background: rgb(179, 38, 203);
    }
  }

  .ce-popover {
    background: #1e202a;
    min-width: 250px;

    .ce-popover-item__icon {
      color: #e5e7eb;
      border: blue;
      background: rgb(179, 38, 203);
    }

    .ce-popover-item__title {
      color: #e5e7eb;
    }

    .ce-popover-item:hover:not(.ce-popover-item--no-hover) {
      background: rgba(255, 255, 255, 0.1);
    }
  }

  .ce-inline-toolbar__dropdown:hover {
    background: #4a4a4a;
    border-radius: 6px;
  }

  .ce-conversion-toolbar {
    background: #1e202a;

    .ce-conversion-tool {
      .ce-conversion-tool__icon svg {
        color: #1e202a;
      }
    }

    .ce-conversion-tool:hover {
      background: #4a4a4a;
    }
  }

  .cdx-search-field {
    color: #e5e7eb;
    background-color: #4a4a4a;

    .cdx-search-field__icon svg {
      color: #e5e7eb;
    }

    .cdx-search-field__input {
      color: #e5e7eb;
    }
  }

  .cdx-input {
    background-color: #1e202a;
  }

  .ce-toolbar {
    @media (min-width: 650px) {
      left: 65px;
    }

    .ce-toolbar__content {
      max-width: 100%;
    }
  }

  .codex-editor {
    .ce-block {
      ::selection {
        background: #8b5cf6;
      }

      .cdx-marker {
        background: rgb(179, 38, 203);
        border-radius: 12px;
        padding: 3px 6px;
        color: #e5e7eb;
      }

      .ce-block__content {
        border-radius: 12px;
        padding: 0 12px;
        max-width: 100%;

        @media (min-width: 650px) {
          margin: 0 60px;
        }

        [contenteditable]:focus-visible {
          border: none;
          outline: none;
        }
      }

      &.ce-block--selected .ce-block__content {
        background: #1e202a;
      }

      &.ce-block--drop-target .ce-block__content {
        border: none;
      }

      a {
        color: #d946ef;

        &:hover {
          color: #8b5cf6;
        }
      }
    }
  }

  .cdx-checklist__item-checkbox-check {
    background: transparent;
    border: 1px solid #4a4a4a;
  }

  .cdx-checklist__item--checked .cdx-checklist__item-checkbox-check {
    background: linear-gradient(to right, #d946ef, #8b5cf6);
    border: none;
  }

  .cdx-search-field__input {
    color: #1e202a;
    padding: 0 0.5em;
  }

  .tc-popover {
    background: #1e202a;

    .tc-popover__item-icon {
      background: transparent;
    }
  }

  .tc-wrap {
    --color-background: #1e202a;
  }

  .ce-inline-toolbar {
    background: #1e202a;

    .ce-inline-tool:hover {
      background-color: #4a4a4a;
    }

    .ce-inline-tool--active {
      //color: #d946ef;
    }

    .ce-inline-toolbar__actions {
      .ce-inline-tool-input {
        &:focus {
          border: none;
          --tw-ring-color: #d946ef;
        }

        background: #1e202a;
      }
    }
  }

  .cdx-simple-image__picture--with-background {
    background: transparent;
  }

  .cdx-settings-button {
    &:hover {
      background: #4a4a4a;
    }

    &.cdx-settings-button--active {
      background: #4a4a4a;
      color: #e5e7eb;
    }

    svg {
      fill: #e5e7eb;
    }
  }

  .tc-row {
    border-left: 1px solid var(--color-border);
  }

  .tc-add-column {
    border-right: 1px solid var(--color-border);
  }

  .tc-toolbox__toggler {
    color: #e5e7eb;

    &:hover {
      color: rgba(229, 231, 235, 0.7);
    }
  }

  .ce-block__generation {
    width: 100%;

    input,
    textarea {
      background: #1e202a;
      width: 100%;
    }

    [contenteditable='true']:empty:not(:focus):before {
      content: attr(data-placeholder);
      color: #4a4a4a;
    }
  }
}
</style>
