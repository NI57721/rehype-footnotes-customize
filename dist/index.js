// src/index.ts
import { relative } from "path";
import { visit } from "unist-util-visit";
function matchesPath(rulePath, relativePath) {
  return typeof rulePath === "string" ? relativePath.startsWith(rulePath) : rulePath.test(relativePath);
}
function isFootnoteLabel(node) {
  return node.properties["id"] === "footnote-label";
}
function isFootnoteBackref(node) {
  return node.tagName === "a" && node.properties["dataFootnoteBackref"] !== void 0;
}
function createTextNode(value) {
  return { type: "text", value };
}
var rehypeFootnotesCustomize = (optionsArray = []) => {
  return (tree, file) => {
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
      visit(tree, "element", (node) => {
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
var index_default = rehypeFootnotesCustomize;
export {
  index_default as default,
  rehypeFootnotesCustomize
};
