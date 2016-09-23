export const outdent: Outdent;
export default outdent;
export interface Outdent {
    /**
     * Remove indentation from a template literal.
     */
    (strings: TemplateStringsArray, ...values: Array<any>): string;
    /**
     * Create and return a new Outdent instance with the given options.
     */
    (options: Options): Outdent;
}
export interface Options {
    trimLeadingNewline?: boolean;
    trimTrailingNewline?: boolean;
}
