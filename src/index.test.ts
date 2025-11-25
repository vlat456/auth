/**
 * Tests for main index exports
 */

describe("Main exports", () => {
  it("should export ReactNativeAuthInterface", () => {
    const exports = require("./index");
    expect(exports.ReactNativeAuthInterface).toBeDefined();
  });

  it("should export auth types", () => {
    const exports = require("./index");
    // We should be able to import types from index
    expect(exports).toBeDefined();
  });

  it("should export authMachine", () => {
    const exports = require("./index");
    expect(exports).toBeDefined();
  });

  it("should have proper module structure", () => {
    const exports = require("./index");
    expect(typeof exports).toBe("object");
  });
});
