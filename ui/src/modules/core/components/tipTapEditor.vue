<script setup lang="ts">
import { ref, watch } from 'vue';
import TipTapEditorButtons from './tipTapEditorButtons.vue';
// import TipTapEditorInlineButtons from './tipTapEditorInlineButtons.vue';
import { MentionPreview } from './mention/mentionPreview';
import ConjurationPreview from './mention/conjurationPreview.vue';
import { useEditor, EditorContent, mergeAttributes } from '@tiptap/vue-3';

import Heading from '@tiptap/extension-heading';
import StarterKit from '@tiptap/starter-kit';
import Blockquote from '@tiptap/extension-blockquote';
import BulletList from '@tiptap/extension-bullet-list';
import ListItem from '@tiptap/extension-list-item';
import OrderedList from '@tiptap/extension-ordered-list';
import HorizontalRule from '@tiptap/extension-horizontal-rule';
import Mention from '@tiptap/extension-mention';
import Bold from '@tiptap/extension-bold';
import Italic from '@tiptap/extension-italic';
import Code from '@tiptap/extension-code';
import Highlight from '@tiptap/extension-highlight';
import Link from '@tiptap/extension-link';
import Strike from '@tiptap/extension-strike';
import Underline from '@tiptap/extension-underline';
import Placeholder from '@tiptap/extension-placeholder';
import TextAlign from '@tiptap/extension-text-align';

import suggestion from './mention/suggestion.ts';

import { useRoute } from 'vue-router';

import {
  List,
  ListOrdered,
  TextQuote,
  Heading1,
  Heading2,
  Heading3,
  Minus,
  BoldIcon,
  ItalicIcon,
  CodeIcon,
  Highlighter,
  LinkIcon,
  Strikethrough,
  UnderlineIcon,
  AlignLeft,
  AlignCenter,
  AlignRight,
} from 'lucide-vue-next';

const route = useRoute();
const editorJson = ref();
const currentMentionId = ref<string>('');

function setLink() {
  const previousUrl = editor.value.getAttributes('link').href;
  const url = window.prompt('URL', previousUrl);

  // cancelled
  if (url === null) {
    return;
  }

  // empty
  if (url === '') {
    editor.value.chain().focus().extendMarkRange('link').unsetLink().run();

    return;
  }

  // update link
  editor.value
    .chain()
    .focus()
    .extendMarkRange('link')
    .setLink({ href: url })
    .run();
}

const editor = useEditor({
  content: null,
  extensions: [
    StarterKit,
    Placeholder.configure({
      placeholder:
        'Start typing anything… You can use @ to add references to conjurations.',
    }),
    Heading.configure({
      levels: [1, 2, 3],
    }),
    Blockquote,
    BulletList.configure({
      HTMLAttributes: {
        class: 'list-disc',
      },
    }),
    OrderedList.configure({
      HTMLAttributes: {
        class: 'list-decimal',
      },
    }),
    ListItem,
    Mention.configure({
      HTMLAttributes: {
        class: 'mention',
      },
      renderHTML({ options, node }) {
        return [
          'span',
          mergeAttributes(
            {
              href: `/conjurations/view/${node.attrs.id}?from=${route.path}`,
              target: '_self',
            },
            options.HTMLAttributes,
          ),
          `${node.attrs.label}`,
        ];
      },
      suggestion,
    }),
    HorizontalRule,
    Bold,
    Italic,
    Code,
    Highlight,
    Link.configure({
      defaultProtocol: 'https',
    }),
    Strike,
    Underline,
    TextAlign,
  ],
  editable: true,
  editorProps: {
    attributes: {
      class: '',
    },
  },
  onUpdate({ editor }) {
    editorJson.value = editor.getHTML();
  },
});

const tools = [
  {
    key: 'blockquote',
    data: null,
    icon: TextQuote,
    tooltip: 'Blockquote',
    toggle: () => editor.value.chain().focus().toggleBlockquote().run(),
    isActive: () => editor.value.isActive('blockquote'),
  },
  {
    key: 'bulletList',
    data: null,
    icon: List,
    tooltip: 'Bullet List',
    toggle: () => editor.value.chain().focus().toggleBulletList().run(),
    isActive: () => editor.value.isActive('bulletList'),
  },
  {
    key: 'orderedList',
    data: null,
    icon: ListOrdered,
    tooltip: 'Numbered List',
    toggle: () => editor.value.chain().focus().toggleOrderedList().run(),
    isActive: () => editor.value.isActive('orderedList'),
  },
  {
    key: 'heading',
    data: { level: 1 },
    icon: Heading1,
    tooltip: 'Heading 1',
    toggle: () =>
      editor.value.chain().focus().toggleHeading({ level: 1 }).run(),
    isActive: () => editor.value.isActive('heading', { level: 1 }),
  },
  {
    key: 'heading',
    data: { level: 2 },
    icon: Heading2,
    tooltip: 'Heading 2',
    toggle: () =>
      editor.value.chain().focus().toggleHeading({ level: 2 }).run(),
    isActive: () => editor.value.isActive('heading', { level: 2 }),
  },
  {
    key: 'heading',
    data: { level: 3 },
    icon: Heading3,
    tooltip: 'Heading 3',
    toggle: () =>
      editor.value.chain().focus().toggleHeading({ level: 3 }).run(),
    isActive: () => editor.value.isActive('heading', { level: 3 }),
  },
  {
    key: 'textAlign',
    data: { align: 'left' },
    icon: AlignLeft,
    tooltip: 'Align Left',
    toggle: () => editor.value.chain().focus().setTextAlign('left').run(),
    isActive: () => editor.value.isActive('textAlign', { align: 'left' }),
  },
  {
    key: 'textAlign',
    data: { align: 'center' },
    icon: AlignCenter,
    tooltip: 'Align Center',
    toggle: () => editor.value.chain().focus().setTextAlign('center').run(),
    isActive: () => editor.value.isActive('textAlign', { align: 'center' }),
  },
  {
    key: 'textAlign',
    data: { align: 'right' },
    icon: AlignRight,
    tooltip: 'Align Right',
    toggle: () => editor.value.chain().focus().setTextAlign('right').run(),
    isActive: () => editor.value.isActive('textAlign', { align: 'right' }),
  },
  {
    key: 'horizontalRule',
    data: null,
    icon: Minus,
    tooltip: 'Horizontal Rule',
    toggle: () => editor.value.chain().focus().setHorizontalRule().run(),
    isActive: () => editor.value.isActive('horizontalRule'),
  },
];

const inlineTools = [
  {
    key: 'bold',
    data: null,
    icon: BoldIcon,
    tooltip: 'Bold',
    toggle: () => editor.value.chain().focus().toggleBold().run(),
    isActive: () => editor.value.isActive('bold'),
  },
  {
    key: 'italic',
    data: null,
    icon: ItalicIcon,
    tooltip: 'Italic',
    toggle: () => editor.value.chain().focus().toggleItalic().run(),
    isActive: () => editor.value.isActive('italic'),
  },
  {
    key: 'code',
    data: null,
    icon: CodeIcon,
    tooltip: 'Code',
    toggle: () => editor.value.chain().focus().toggleCode().run(),
    isActive: () => editor.value.isActive('code'),
  },
  {
    key: 'highlight',
    data: null,
    icon: Highlighter,
    tooltip: 'Highlight',
    toggle: () => editor.value.chain().focus().toggleHighlight().run(),
    isActive: () => editor.value.isActive('highlight'),
  },
  {
    key: 'link',
    data: null,
    icon: LinkIcon,
    tooltip: 'Link',
    toggle: () => setLink(),
    isActive: () => editor.value.isActive('link'),
  },
  {
    key: 'strike',
    data: null,
    icon: Strikethrough,
    tooltip: 'Strikethrough',
    toggle: () => editor.value.chain().focus().toggleStrike().run(),
    isActive: () => editor.value.isActive('strike'),
  },
  {
    key: 'underline',
    data: null,
    icon: UnderlineIcon,
    tooltip: 'Underline',
    toggle: () => editor.value.chain().focus().toggleUnderline().run(),
    isActive: () => editor.value.isActive('underline'),
  },
];
</script>

<template>
  <div class="container">
    <div v-if="editor" class="flex items-center gap-2 mb-1">
      <TipTapEditorButtons :tools="tools" />
    </div>
    <MentionPreview v-if="editor" :editor="editor">
      <template #default="{ mentionId }">
        <ConjurationPreview
          v-if="mentionId"
          :key="mentionId"
          :conjuration-id="Number(mentionId)"
        />
      </template>
    </MentionPreview>
    <editor-content :editor="editor" />
  </div>
</template>
