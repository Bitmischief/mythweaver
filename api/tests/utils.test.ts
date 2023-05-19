import {sanitizeJson} from "../lib/utils";

const testStrings = [
  `Answer.
  {
  "name": "Ajax Sanscoeur",
  "looks": "Ajax is a tall human male, standing just over 6 feet in height and boasting a strong, muscular physique. His golden-blond hair is always cut stylishly short and he usually carries himself with a sense of purposeful confidence.",
  "personality": "Ajax is a driven, loyal man who rarely displays sorrow or regret. He is quick to act in any given situation, never missing a beat or a chance to serve others in need. Furthermore, Ajax is deeply devoted to his faith, and is unwavering in his devotion to do that which is right.",
  "background": "Ajax's past is one defined by a sense of duty and honor. Raised to follow in his father's footsteps, Ajax became a paladin of the Silver Order, a prestigio
us group of warriors and peacemakers sworn to protect all in need and uphold justice in the realms of the living. Throughout his travels, Ajax has dutifully protected others, no matter the cost."
}`,
  `{
  "name": "Ajax Sanscoeur",
  "looks": "Ajax is a tall human male, standing just over 6 feet in height and boasting a strong, muscular physique. His golden-blond hair is always cut stylishly short and he usually carries himself with a sense of purposeful confidence.",
  "personality": "Ajax is a driven, loyal man who rarely displays sorrow or regret. He is quick to act in any given situation, never missing a beat or a chance to serve others in need. Furthermore, Ajax is deeply devoted to his faith, and is unwavering in his devotion to do that which is right.",
  "background": "Ajax's past is one defined by a sense of duty and honor. Raised to follow in his father's footsteps, Ajax became a paladin of the Silver Order, a prestigio
us group of warriors and peacemakers sworn to protect all in need and uphold justice in the realms of the living. Throughout his travels, Ajax has dutifully protected others, no matter the cost."
}`,
  `{"name":"Jurnaeh","looks":"Jurnaeh has dark grey eyes, chocolate-brown skin, and medium-length, curly black hair. She is 5'6" tall and has an athletic build.","personality":"Jurnaeh is a passionate, strong-willed, and brave soul. She is driven by her compassion for others and values knowledge above all else. Quiet and stoic at times"}`
];

test
  .each(testStrings)
  ('testString is valid', (testString) => {
    const fixedString = sanitizeJson(testString);
    const validObject = JSON.parse(fixedString);
    console.log(validObject);
});