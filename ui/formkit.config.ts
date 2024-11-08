import { rootClasses } from './formkit.theme.ts';
import { createAutoAnimatePlugin, createAutoHeightTextareaPlugin } from '@formkit/addons';
import { defineFormKitConfig } from '@formkit/vue';

import { createProPlugin, inputs } from '@formkit/pro';

const pro = createProPlugin('fk-66462aa44b3', inputs);

export default defineFormKitConfig({
  config: {
    rootClasses,
  },
  plugins: [pro, createAutoAnimatePlugin(), createAutoHeightTextareaPlugin()],
});
