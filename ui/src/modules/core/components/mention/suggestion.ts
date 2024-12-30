import { VueRenderer } from '@tiptap/vue-3';
import tippy from 'tippy.js';
import { getConjurations } from '@/modules/conjurations/api/conjuration.api';

import MentionList from './mentionList.vue';

export default {
  items: async ({ query }: { query: string }) => {
    const conjurations = await getConjurations({
      search: query,
      limit: 5,
      offset: 0,
      saved: true,
      mine: true,
    });

    return conjurations.data.data;
  },

  render: () => {
    let component: any;
    let popup: any;

    return {
      onStart: (props: any) => {
        component = new VueRenderer(MentionList, {
          props,
          editor: props.editor,
        });

        if (!props.clientRect) {
          return;
        }

        popup = tippy('body', {
          getReferenceClientRect: props.clientRect,
          appendTo: () => document.body,
          content: component.element,
          showOnCreate: true,
          interactive: true,
          trigger: 'manual',
          placement: 'bottom-start',
        });
      },

      onUpdate(props: any) {
        component.updateProps(props);

        if (!props.clientRect) {
          return;
        }

        popup[0].setProps({
          getReferenceClientRect: props.clientRect,
        });
      },

      onKeyDown(props: any) {
        if (props.event.key === 'Escape') {
          popup[0].hide();

          return true;
        }

        return component.ref?.onKeyDown(props.event);
      },

      onExit() {
        popup[0].destroy();
        component.destroy();
      },
    };
  },
};
