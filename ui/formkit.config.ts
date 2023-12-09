import { generateClasses } from '@formkit/themes';
import { genesisIcons } from '@formkit/icons';
import tailwindTheme from './tailwind-theme';
import { createAutoAnimatePlugin, createAutoHeightTextareaPlugin } from '@formkit/addons'; // change to your theme's path
import { defineFormKitConfig } from '@formkit/vue';

export default defineFormKitConfig({
  icons: {
    ...genesisIcons,
  },
  config: {
    classes: generateClasses(tailwindTheme),
  },
  plugins: [createAutoAnimatePlugin(), createAutoHeightTextareaPlugin()],
});
