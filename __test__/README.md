# Tests
Why the `tsconfig.json` in here? If we don't compile to ES6 it causes issues in
the coverage numbers due to the polyfills required for `extends` and `super`.

It's easier to test as ES6 and get accurate coverage info, but compile to ES5
for distribution for wider support.
