import { Root } from 'hast';
import { Plugin } from 'unified';

interface RehypeFootnotesCustomizeOptions {
    path: RegExp | string;
    footnoteLabel?: string;
    footnoteBackContent?: string;
}
declare const rehypeFootnotesCustomize: Plugin<[
    Array<RehypeFootnotesCustomizeOptions>?
], Root>;

export { type RehypeFootnotesCustomizeOptions, rehypeFootnotesCustomize as default, rehypeFootnotesCustomize };
