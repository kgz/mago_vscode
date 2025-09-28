import typescriptEslint from "@typescript-eslint/eslint-plugin";
import tsParser from "@typescript-eslint/parser";

export default [{
    files: ["**/*.ts"],
    ignores: ["eslint.config.mjs", "esbuild.js"],
}, {
    plugins: {
        "@typescript-eslint": typescriptEslint,
    },

    languageOptions: {
        parser: tsParser,
        parserOptions: {
            ecmaVersion: 2022,
            sourceType: "module",
            project: "./tsconfig.json",
        },
    },

    rules: {
        "@typescript-eslint/naming-convention": ["warn", {
            selector: "import",
            format: ["camelCase", "PascalCase"],
        }],

        // Basic formatting
        curly: "warn",
        eqeqeq: "warn",
        "no-throw-literal": "warn",
        semi: "warn",
        
        // Spacing and formatting
        "object-curly-spacing": ["warn", "always"],
        "array-bracket-spacing": ["warn", "never"],
        "computed-property-spacing": ["warn", "never"],
        "space-before-blocks": "warn",
        "keyword-spacing": "warn",
        "space-infix-ops": "warn",
        "space-before-function-paren": ["warn", "never"],
        "space-in-parens": ["warn", "never"],
        "space-unary-ops": "warn",
        
        // TypeScript specific
        "@typescript-eslint/no-explicit-any": "warn",
        "@typescript-eslint/prefer-nullish-coalescing": "warn",
        "@typescript-eslint/prefer-optional-chain": "warn",
    },
}];