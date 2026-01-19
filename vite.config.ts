import { defineConfig } from "vitest/config"

export default defineConfig({
    test: {
        alias: {
            "~/": new URL("./src/", import.meta.url).pathname,
        },
        pool: "threads",
        // Vitest 4.x configuration
        isolate: false, // Share context between tests for better performance
        fileParallelism: true, // Run test files in parallel
        maxConcurrency: 20, // Run up to 10 tests at once
    },
})
