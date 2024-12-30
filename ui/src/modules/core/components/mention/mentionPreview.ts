import { MentionPreviewPlugin, MentionPreviewPluginProps } from './mentionPreviewPlugin';
import { defineComponent, h, onBeforeUnmount, onMounted, PropType, ref } from 'vue';

export const MentionPreview = defineComponent({
  name: 'MentionPreview',

  props: {
    pluginKey: {
      type: [String, Object] as PropType<MentionPreviewPluginProps['pluginKey']>,
      default: 'mentionPreview',
    },

    editor: {
      type: Object as PropType<MentionPreviewPluginProps['editor']>,
      required: true,
    },
  },

  setup(props, { slots }) {
    const root = ref<HTMLElement | null>(null);
    const currentMentionId = ref<string>('');

    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (
          mutation.type === 'attributes' &&
          mutation.attributeName === 'data-current-mention-id'
        ) {
          const element = mutation.target as HTMLElement;
          currentMentionId.value = element.dataset.currentMentionId ?? '';
        }
      });
    });

    onMounted(() => {
      const { editor, pluginKey } = props;

      if (root.value) {
        root.value.dataset.mentionPreview = '';
        observer.observe(root.value, {
          attributes: true,
          attributeFilter: ['data-current-mention-id'],
        });
      }

      editor.registerPlugin(
        MentionPreviewPlugin({
          editor,
          element: root.value as HTMLElement,
          pluginKey,
        }),
      );
    });

    onBeforeUnmount(() => {
      const { pluginKey, editor } = props;
      observer.disconnect();
      editor.unregisterPlugin(pluginKey);
    });

    return () =>
      h(
        'div',
        {
          ref: root,
          'data-mention-preview': '',
        },
        slots.default?.({ mentionId: currentMentionId.value }),
      );
  },
});
