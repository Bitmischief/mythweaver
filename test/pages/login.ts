const { I } = inject();

export = {
  fields: {
    email: 'input[name="email"]',
  },
  loginButton: 'Login',

  login(email: string) {
    I.amOnPage('/');
    I.see('Welcome to MythWeaver');
    I.click(this.fields.email);
    I.type(email);
    I.click(this.loginButton);
    I.see("We've emailed you a one-time login link");
  },
};
