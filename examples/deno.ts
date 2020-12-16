import outdent from "http://deno.land/x/outdent/mod.ts";

console.log(outdent`
  Hello
    world!
  ${"multiline\ntext\nnot\naffected"}
`);
