import outdent from "../mod.ts";

console.log(outdent`
  Hello
    world!
  ${"multiline\ntext\nnot\naffected"}
`);
