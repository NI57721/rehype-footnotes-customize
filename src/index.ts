import { relative } from "node:path";
import { visit } from "unist-util-visit";
import type { Element, Root, Text } from "hast";
import type { Plugin } from "unified";
import type { VFile } from "vfile";

export interface RehypeFootnotesCustomizeOptions {
  path: RegExp | string;
  footnoteLabel?: string;
  footnoteBackContent?: string;
}

function matchesPath(rulePath: RegExp | string, relativePath: string): boolean {
  return typeof rulePath === "string"
    ? relativePath.startsWith(rulePath)
    : rulePath.test(relativePath);
}

function isFootnoteLabel(node: Element): boolean {
  return node.properties["id"] === "footnote-label";
}

function isFootnoteBackref(node: Element): boolean {
  return (
    node.tagName === "a" && node.properties["dataFootnoteBackref"] !== undefined
  );
}

function createTextNode(value: string): Text {
  return { type: "text", value };
}

const rehypeFootnotesCustomize: Plugin<
  [Array<RehypeFootnotesCustomizeOptions>?],
  Root
> = (optionsArray: Array<RehypeFootnotesCustomizeOptions> = []) => {
  return (tree: Root, file: VFile) => {
    const filePath = file.path;
    if (!filePath) {
      return;
    }

    const relativePath = relative(process.cwd(), filePath).replace(/\\/g, "/");
    for (const options of optionsArray) {
      const { path, footnoteLabel, footnoteBackContent } = options;

      if (!matchesPath(path, relativePath)) {
        continue;
      }

      visit(tree, "element", (node: Element) => {
        if (footnoteLabel && isFootnoteLabel(node)) {
          node.children = [createTextNode(footnoteLabel)];
        }
        if (footnoteBackContent && isFootnoteBackref(node)) {
          node.children = [createTextNode(footnoteBackContent)];
        }
      });
    }
  };
};

export default rehypeFootnotesCustomize;
export { rehypeFootnotesCustomize };
