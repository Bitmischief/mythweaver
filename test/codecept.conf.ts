import {
  setHeadlessWhen,
  setCommonPlugins,
  setWindowSize
} from '@codeceptjs/configure';
setHeadlessWhen(process.env.HEADLESS);
setWindowSize(1920, 1080);

// enable all common plugins https://github.com/codeceptjs/configure#setcommonplugins
setCommonPlugins();

export const config: CodeceptJS.MainConfig = {
  tests: './**/*_test.ts',
  output: './output',
  helpers: {
    Playwright: {
      browser: 'chromium',
      url: 'http://localhost:3000',
      show: true
    }
  },
  include: {
    I: './steps_file',
    loginPage: "./pages/login.ts",
  },
  name: 'test'
}