import next from "eslint-config-next";

/** @type {import('eslint').Linter.Config} */
const config = {
  ...next,
  rules: {
    ...next.rules,
    // custom rules...
  },
};

export default config; 