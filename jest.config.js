module.exports = {
    preset: "ts-jest",
    testEnvironment: "jsdom",
    setupFilesAfterEnv: ["<rootDir>/src/setupTests.ts"],
    moduleNameMapping: {
        "\\.(css|less|scss|sass)$": "identity-obj-proxy",
    },
};
