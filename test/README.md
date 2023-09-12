### Welcome to Testing Land :

This section is for, you guessed it, testing. Please check back as this section continues to grow, and will be updated as we progress.

We are using Codeceptjs for our e2e testing framework. It is currently a wrapper around Playwright; though you may target other drivers. And in our case currently targeting Chromium; though again, you may target other browsers as well.
This can, and likely will be expanded in the future to include other browsers.

#### Running Tests

To run tests, you can use the following command:

```bash
yarn codeceptjs
```

Alternatively, you will also have access to the following commands:

```bash
yarn codeceptjs:headless
yarn codeceptjs:ui
```

The first command will run the tests in headless mode, meaning you will not see the browser window open and close.
The second command will run the codecept ui which will allow you to access the tests in a more visual way, as well as have access to some useful features such as seeing each step of a test and debug through it.

#### Writing Tests

Currently the thinking is we will have a folder for each section of codebase, "api" and "ui". Within these we could further nest for e2e and integration tests, but for now we will keep it simple. As the scope grows we can revisit this and refactor.

In order to start writing a test you will either need to create a test file which ends with `_test.ts`, or alternatively, use the cli command

```bash
npx codeceptjs gt
```

This will prompt you for what feature is being tested, which is used as the feature name in the test file. As well as the filename of the test which will be used as the save location and name. You may add file structure to this such as

```bash
ui/login_test.ts
```

#### Additional Information

For more information on how to write tests, please see the [Codeceptjs Documentation](https://codecept.io/). More specifically, the section for [Testing with Playwright](https://codecept.io/playwright/).

