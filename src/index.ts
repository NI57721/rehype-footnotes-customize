import type { Plugin } from "unified";
import type { Root, Element, Text } from "hast";
import type { VFile } from "vfile";
import { visit } from "unist-util-visit";
import { relative } from "node:path";

export interface RehypeFootnotesCustomizeOptions {
  path: RegExp | string;
  footnoteLabel?: string;
  footnoteBackContent?: string;
}

const rehypeFootnotesCustomize: Plugin<
  [Array<RehypeFootnotesCustomizeOptions>?],
  Root
> = (optionsArray: Array<RehypeFootnotesCustomizeOptions> = []) => {
  return (tree: Root, file: VFile) => {
    const filePath = file.path ?? "";
    if (!filePath) {
      return;
    }

    const relativePath = relative(process.cwd(), filePath).replace(/\\/g, "/");
    for (const options of optionsArray) {
      const { path, footnoteLabel, footnoteBackContent } = options;

      if (typeof path === "string") {
        if (!relativePath.includes(path)) {
          continue;
        }
      } else {
        if (!path.test(relativePath)) {
          continue;
        }
      }

      visit(tree, "element", (node: Element) => {
        if (footnoteLabel) {
          const id = node.properties["id"];
          if (id === "footnote-label") {
            node.children = [{ type: "text", value: footnoteLabel } as Text];
          }
        }
        if (footnoteBackContent) {
          if (
            node.tagName === "a" &&
            node.properties["dataFootnoteBackref"] !== undefined
          ) {
            node.children = [
              { type: "text", value: footnoteBackContent } as Text,
            ];
          }
        }
      });
    }
  };
};

export default rehypeFootnotesCustomize;
export { rehypeFootnotesCustomize };
