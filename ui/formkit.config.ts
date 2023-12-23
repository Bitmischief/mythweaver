import { rootClasses } from './formkit.theme.ts';
import { createAutoAnimatePlugin, createAutoHeightTextareaPlugin } from '@formkit/addons';
import { defineFormKitConfig } from '@formkit/vue';

export default defineFormKitConfig({
  config: {
    rootClasses,
  },
  plugins: [createAutoAnimatePlugin(), createAutoHeightTextareaPlugin()],
});
