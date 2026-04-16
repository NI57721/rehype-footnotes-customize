import path from "node:path";
import { describe, expect, it } from "vitest";
import { VFile } from "vfile";
import { unified } from "unified";
import { visit } from "unist-util-visit";
import { fromHtml } from "hast-util-from-html";
import { toString } from "hast-util-to-string";
import remarkParse from "remark-parse";
import remarkGfm from "remark-gfm";
import remarkRehype from "remark-rehype";
import rehypeStringify from "rehype-stringify";

import type { RehypeFootnotesCustomizeOptions } from "../src/index";
import rehypeFootnotesCustomize from "../src/index";

async function render(
  markdown: string,
  relativeFilePath: string,
  rules: Array<RehypeFootnotesCustomizeOptions>,
) {
  const file = new VFile({
    path: path.join(process.cwd(), relativeFilePath),
    value: markdown,
  });
  const result = await unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkRehype)
    .use(rehypeFootnotesCustomize, rules)
    .use(rehypeStringify)
    .process(file);

  return String(result);
}

async function renderWithoutRules(markdown: string, relativeFilePath: string) {
  const file = new VFile({
    path: path.join(process.cwd(), relativeFilePath),
    value: markdown,
  });
  const result = await unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkRehype)
    .use(rehypeFootnotesCustomize)
    .use(rehypeStringify)
    .process(file);

  return String(result);
}

async function originallyRender(markdown: string, relativeFilePath: string) {
  const file = new VFile({
    path: path.join(process.cwd(), relativeFilePath),
    value: markdown,
  });
  const result = await unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkRehype)
    .use(rehypeStringify)
    .process(file);

  return String(result);
}

function footnoteLabel(html: string): string | undefined {
  const tree = fromHtml(html, { fragment: true });
  let value: string | undefined;

  visit(tree, "element", (node) => {
    if (node.properties["id"] === "footnote-label") {
      value = toString(node);
    }
  });

  return value;
}

function footnoteBackContents(html: string): string[] {
  const tree = fromHtml(html, { fragment: true });
  const values: string[] = [];

  visit(tree, "element", (node) => {
    if (
      node.tagName === "a" &&
      node.properties["dataFootnoteBackref"] !== undefined
    ) {
      values.push(toString(node));
    }
  });

  return values;
}

describe("rehypeFootnotesCustomize", () => {
  it("changes the footnote label and the back content when the path matches", async () => {
    const html = await render(
      "Hello[^1], World[^2]!\n\n[^1]: hello\n[^2]: world",
      "src/blog/de/post.md",
      [
        {
          path: /^src\/blog\/ja\//,
          footnoteLabel: "脚註",
          footnoteBackContent: "戻る",
        },
        {
          path: /^src\/blog\/de\//,
          footnoteLabel: "Fußnoten",
          footnoteBackContent: "Zurück",
        },
      ],
    );
    const backContents = footnoteBackContents(html);

    expect(footnoteLabel(html)).toBe("Fußnoten");
    expect(backContents).toHaveLength(2);
    expect(backContents).toEqual(["Zurück", "Zurück"]);
  });

  it("changes the footnote label and the back content when multiple rules match", async () => {
    const html = await render(
      "Hello[^1], World[^2]!\n\n[^1]: hello\n[^2]: world",
      "src/blog/de/post.md",
      [
        {
          path: /^src\/blog\/de\//,
          footnoteLabel: "Fußnoten",
        },
        {
          path: "blog/de/",
          footnoteBackContent: "Zurück",
        },
      ],
    );
    const backContents = footnoteBackContents(html);

    expect(footnoteLabel(html)).toBe("Fußnoten");
    expect(backContents).toHaveLength(2);
    expect(backContents).toEqual(["Zurück", "Zurück"]);
  });

  it("overrides the earlier change when multiple rules match", async () => {
    const html = await render(
      "Hello[^1], World[^2]!\n\n[^1]: hello\n[^2]: world",
      "src/blog/post.md",
      [
        {
          path: /^src\/blog\//,
          footnoteLabel: "脚註",
          footnoteBackContent: "戻る",
        },
        {
          path: /^src\/blog\//,
          footnoteLabel: "Fußnoten",
          footnoteBackContent: "Zurück",
        },
      ],
    );

    expect(footnoteLabel(html)).toBe("Fußnoten");
    footnoteBackContents(html).forEach((backContent) => {
      expect(backContent).toBe("Zurück");
    });
  });

  it("does nothing when no options are provided", async () => {
    const md = "Hello[^1], World[^2]!\n\n[^1]: hello\n[^2]: world";
    const p = "src/blog/post.md";
    const html = await renderWithoutRules(md, p);
    const originalHtml = await originallyRender(md, p);

    expect(html).toBe(originalHtml);
  });

  it("does nothing when a string path does not match", async () => {
    const md = "Hello[^1], World[^2]!\n\n[^1]: hello\n[^2]: world";
    const p = "src/blog/post.md";
    const html = await render(md, p, [
      {
        path: "blog/post-de.md",
        footnoteLabel: "Fußnoten",
        footnoteBackContent: "Zurück",
      },
    ]);
    const originalHtml = await originallyRender(md, p);

    expect(html).toBe(originalHtml);
  });

  it("does nothing when a regexp path does not match", async () => {
    const md = "Hello[^1], World[^2]!\n\n[^1]: hello\n[^2]: world";
    const p = "src/blog/post.md";
    const html = await render(md, p, [
      {
        path: /^src\/blog\/de\//,
        footnoteLabel: "Fußnoten",
        footnoteBackContent: "Zurück",
      },
    ]);
    const originalHtml = await originallyRender(md, p);

    expect(html).toBe(originalHtml);
  });
});
