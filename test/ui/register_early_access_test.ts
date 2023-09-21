Feature('Register Early Access');

Scenario('Can get to mailing list page', ({ I }) => {
  I.amOnPage('/');
  I.click('#early-access-link')
  I.click('#mailing-list-link')
  I.amOnPage('mythweaver.co/#mailing')
});
