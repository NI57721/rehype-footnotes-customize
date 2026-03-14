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
  [RehypeFootnotesCustomizeOptions[]?],
  Root
> = (optionsArray = []) => {
  return (tree: Root, file: VFile) => {
    // const filePath = String((file as any)?.path ?? "");
    const filePath = file.path ?? "";
    if (!filePath) {
      return;
    }

    const relativePath =
      "/" + relative(process.cwd(), filePath).replaceAll("\\", "/");
    for (const options of optionsArray) {
      const { path, footnoteLabel, footnoteBackContent } = options;

      if (path instanceof RegExp) {
        if (!path.test(relativePath)) {
          continue;
        }
      } else {
        if (!relativePath.includes(path)) {
          continue;
        }
      }

      visit(tree, "element", (node: Element) => {
        if (footnoteLabel) {
          const id = node.properties?.id;
          if (id === "footnote-label") {
            node.children = [{ type: "text", value: footnoteLabel } as Text];
          }
        }
        if (footnoteBackContent) {
          if (
            node.tagName === "a" &&
            node.properties?.dataFootnoteBackref !== undefined
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
