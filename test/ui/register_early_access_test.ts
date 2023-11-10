Feature('Magic Link');

Scenario('Send myself a magic link with valid e-mail', ({ I, loginPage }) => {
  loginPage.login('Andrew.S.Lobdell@gmail.com');
  I.click('Back to login');
  I.see('Welcome to MythWeaver');
});

