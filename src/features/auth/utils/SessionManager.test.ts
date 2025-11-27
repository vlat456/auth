import { SessionManager } from "./SessionManager";
import { AuthSession, UserProfile, IStorage } from "../types";

// Mock storage implementation for testing
class MockStorage implements IStorage {
  private store: Map<string, string> = new Map();

  async getItem(key: string): Promise<string | null> {
    return this.store.get(key) || null;
  }

  async setItem(key: string, value: string): Promise<void> {
    this.store.set(key, value);
  }

  async removeItem(key: string): Promise<void> {
    this.store.delete(key);
  }
}

describe("SessionManager", () => {
  let sessionManager: SessionManager;
  let mockStorage: MockStorage;

  const validSession: AuthSession = {
    accessToken: "valid-access-token",
    refreshToken: "valid-refresh-token",
    profile: {
      id: "user123",
      email: "test@example.com",
      name: "Test User",
    },
  };

  const validProfile: UserProfile = {
    id: "user123",
    email: "test@example.com",
    name: "Test User",
  };

  beforeEach(() => {
    mockStorage = new MockStorage();
    sessionManager = new SessionManager({ storage: mockStorage });
  });

  describe("saveSession and readSession", () => {
    it("should save and read a valid session", async () => {
      await sessionManager.saveSession(validSession);
      const retrievedSession = await sessionManager.readSession();

      expect(retrievedSession).toEqual(validSession);
    });

    it("should return null when no session exists", async () => {
      const session = await sessionManager.readSession();
      expect(session).toBeNull();
    });

    it("should handle session with only access token", async () => {
      const minimalSession: AuthSession = {
        accessToken: "minimal-token",
      };

      await sessionManager.saveSession(minimalSession);
      const retrievedSession = await sessionManager.readSession();

      expect(retrievedSession).toEqual(minimalSession);
    });

    it("should handle session with refresh token but no profile", async () => {
      const sessionWithoutProfile: AuthSession = {
        accessToken: "token-without-profile",
        refreshToken: "refresh-token",
      };

      await sessionManager.saveSession(sessionWithoutProfile);
      const retrievedSession = await sessionManager.readSession();

      expect(retrievedSession).toEqual(sessionWithoutProfile);
    });

    it("should handle malformed JSON in storage", async () => {
      await mockStorage.setItem("user_session_token", "{invalid:json");
      const session = await sessionManager.readSession();
      expect(session).toBeNull();
    });

    it("should handle legacy string token format", async () => {
      await mockStorage.setItem("user_session_token", "legacy-token");
      const session = await sessionManager.readSession();
      expect(session).toEqual({ accessToken: "legacy-token" });
    });

    it("should handle invalid session format", async () => {
      await mockStorage.setItem(
        "user_session_token",
        JSON.stringify({ refreshToken: "no-access-token" })
      );
      const session = await sessionManager.readSession();
      expect(session).toBeNull();
    });

    it("should handle session with invalid profile but valid access token (fallback path - valid profile)", async () => {
      // This test covers the branch where the main validation fails but
      // legacy validation passes with valid profile
      await mockStorage.setItem(
        "user_session_token",
        JSON.stringify({
          accessToken: "fallback-token",
          refreshToken: "fallback-refresh",
          profile: {
            id: "user123",
            email: "test@example.com"  // Valid but minimal profile that passes isUserProfile check
          }
        })
      );
      const session = await sessionManager.readSession();

      // Should return the session with minimal profile since it passes isUserProfile validation
      expect(session).toEqual({
        accessToken: "fallback-token",
        refreshToken: "fallback-refresh",
        profile: {
          id: "user123",
          email: "test@example.com"
        }
      });
    });

    it("should handle session with invalid profile in fallback path (isUserProfile returns false)", async () => {
      // This test covers the branch where isUserProfile returns false
      await mockStorage.setItem(
        "user_session_token",
        JSON.stringify({
          accessToken: "fallback-token",
          refreshToken: "fallback-refresh",
          profile: {
            invalid: "profile"  // Invalid profile that fails isUserProfile check
          }
        })
      );
      const session = await sessionManager.readSession();

      // Should return the session but with profile set to undefined since isUserProfile returns false
      expect(session).toEqual({
        accessToken: "fallback-token",
        refreshToken: "fallback-refresh",
        profile: undefined
      });
    });

    it("should handle session with invalid profile", async () => {
      const sessionWithInvalidProfile = {
        ...validSession,
        profile: { invalid: "profile" }, // Invalid profile structure
      };

      await mockStorage.setItem(
        "user_session_token",
        JSON.stringify(sessionWithInvalidProfile)
      );
      const session = await sessionManager.readSession();

      // Should return session but with profile set to undefined
      expect(session).toEqual({
        ...validSession,
        profile: undefined,
      });
    });
  });

  describe("removeSession", () => {
    it("should remove session from storage", async () => {
      await sessionManager.saveSession(validSession);
      const sessionBefore = await sessionManager.readSession();
      expect(sessionBefore).not.toBeNull();

      await sessionManager.removeSession();
      const sessionAfter = await sessionManager.readSession();
      expect(sessionAfter).toBeNull();
    });
  });

  describe("createSession", () => {
    it("should create a new session with access and refresh tokens", () => {
      const session = sessionManager.createSession(
        "new-access-token",
        "new-refresh-token"
      );

      expect(session).toEqual({
        accessToken: "new-access-token",
        refreshToken: "new-refresh-token",
      });
    });

    it("should create a new session with access token, refresh token, and profile", () => {
      const session = sessionManager.createSession(
        "new-access-token",
        "new-refresh-token",
        validProfile
      );

      expect(session).toEqual({
        accessToken: "new-access-token",
        refreshToken: "new-refresh-token",
        profile: validProfile,
      });
    });
  });

  describe("updateAccessToken", () => {
    it("should update access token while preserving other properties", () => {
      const updatedSession = sessionManager.updateAccessToken(
        validSession,
        "updated-access-token"
      );

      expect(updatedSession).toEqual({
        accessToken: "updated-access-token",
        refreshToken: "valid-refresh-token",
        profile: validProfile,
      });
    });

    it("should work with session that has no refresh token", () => {
      const sessionWithoutRefresh = {
        accessToken: "old-token",
      };

      const updatedSession = sessionManager.updateAccessToken(
        sessionWithoutRefresh,
        "new-token"
      );

      expect(updatedSession).toEqual({
        accessToken: "new-token",
      });
    });

    it("should work with session that has no profile", () => {
      const sessionWithoutProfile = {
        accessToken: "old-token",
        refreshToken: "refresh-token",
      };

      const updatedSession = sessionManager.updateAccessToken(
        sessionWithoutProfile,
        "new-token"
      );

      expect(updatedSession).toEqual({
        accessToken: "new-token",
        refreshToken: "refresh-token",
      });
    });
  });

  describe("updateProfile", () => {
    it("should update profile while preserving other properties", () => {
      const newProfile: UserProfile = {
        id: "new-user",
        email: "new@example.com",
      };

      const updatedSession = sessionManager.updateProfile(validSession, newProfile);

      expect(updatedSession).toEqual({
        accessToken: "valid-access-token",
        refreshToken: "valid-refresh-token",
        profile: newProfile,
      });
    });

    it("should work with session that has no existing profile", () => {
      const sessionWithoutProfile = {
        accessToken: "token",
        refreshToken: "refresh-token",
      };

      const updatedSession = sessionManager.updateProfile(
        sessionWithoutProfile,
        validProfile
      );

      expect(updatedSession).toEqual({
        accessToken: "token",
        refreshToken: "refresh-token",
        profile: validProfile,
      });
    });

    it("should work with session that has no refresh token", () => {
      const sessionWithoutRefresh = {
        accessToken: "token",
      };

      const updatedSession = sessionManager.updateProfile(
        sessionWithoutRefresh,
        validProfile
      );

      expect(updatedSession).toEqual({
        accessToken: "token",
        profile: validProfile,
      });
    });
  });

  describe("createRefreshedSession", () => {
    it("should create a refreshed session preserving refresh token and profile", () => {
      const refreshedSession = sessionManager.createRefreshedSession(
        validSession,
        "new-access-token"
      );

      expect(refreshedSession).toEqual({
        accessToken: "new-access-token",
        refreshToken: "valid-refresh-token",
        profile: validProfile,
      });
    });

    it("should work with session that has no profile", () => {
      const sessionWithoutProfile = {
        accessToken: "old-token",
        refreshToken: "refresh-token",
      };

      const refreshedSession = sessionManager.createRefreshedSession(
        sessionWithoutProfile,
        "new-access-token"
      );

      expect(refreshedSession).toEqual({
        accessToken: "new-access-token",
        refreshToken: "refresh-token",
        profile: undefined,
      });
    });

    it("should work with session that has no refresh token", () => {
      const sessionWithoutRefresh = {
        accessToken: "old-token",
      };

      const refreshedSession = sessionManager.createRefreshedSession(
        sessionWithoutRefresh,
        "new-access-token"
      );

      expect(refreshedSession).toEqual({
        accessToken: "new-access-token",
        refreshToken: undefined,
        profile: undefined,
      });
    });
  });

  describe("validateSession", () => {
    it("should return true for a valid session", () => {
      expect(sessionManager.validateSession(validSession)).toBe(true);
    });

    it("should return false for null", () => {
      expect(sessionManager.validateSession(null)).toBe(false);
    });

    it("should return false for undefined", () => {
      expect(sessionManager.validateSession(undefined)).toBe(false);
    });

    it("should return false for session without access token", () => {
      const invalidSession = {
        refreshToken: "refresh-token",
        profile: validProfile,
      };
      expect(sessionManager.validateSession(invalidSession)).toBe(false);
    });

    it("should return false for session with empty access token", () => {
      const invalidSession = {
        accessToken: "",
        refreshToken: "refresh-token",
        profile: validProfile,
      };
      expect(sessionManager.validateSession(invalidSession)).toBe(false);
    });

    it("should return false for session with short access token", () => {
      const invalidSession = {
        accessToken: "sho", // Less than 5 characters
        refreshToken: "refresh-token",
        profile: validProfile,
      };
      expect(sessionManager.validateSession(invalidSession)).toBe(false);
    });

    it("should return true for session with only access token", () => {
      const minimalSession = {
        accessToken: "long-enough-token",
      };
      expect(sessionManager.validateSession(minimalSession)).toBe(true);
    });
  });

  describe("validateProfile", () => {
    it("should return true for a valid profile", () => {
      expect(sessionManager.validateProfile(validProfile)).toBe(true);
    });

    it("should return false for null", () => {
      expect(sessionManager.validateProfile(null)).toBe(false);
    });

    it("should return false for undefined", () => {
      expect(sessionManager.validateProfile(undefined)).toBe(false);
    });

    it("should return false for profile without required fields", () => {
      const invalidProfile = {
        id: "user123",
        // missing email
      };
      expect(sessionManager.validateProfile(invalidProfile)).toBe(false);
    });

    it("should return false for profile with invalid email", () => {
      const invalidProfile = {
        id: "user123",
        email: "invalid-email",
      };
      expect(sessionManager.validateProfile(invalidProfile)).toBe(false);
    });

    it("should return false for profile with non-string id", () => {
      const invalidProfile = {
        id: 123,
        email: "test@example.com",
      };
      expect(sessionManager.validateProfile(invalidProfile)).toBe(false);
    });

    it("should return false for profile with non-string email", () => {
      const invalidProfile = {
        id: "user123",
        email: 456,
      };
      expect(sessionManager.validateProfile(invalidProfile)).toBe(false);
    });
  });

  describe("storage key configuration", () => {
    it("should use custom storage key when provided", async () => {
      const customKeySessionManager = new SessionManager({
        storage: mockStorage,
        storageKey: "custom_session_key",
      });

      await customKeySessionManager.saveSession(validSession);
      
      // Check that the session was saved with the custom key
      const sessionFromCustomKey = await customKeySessionManager.readSession();
      expect(sessionFromCustomKey).toEqual(validSession);
      
      // Check that the default key has no value
      await mockStorage.setItem("user_session_token", "default-key-value");
      const sessionFromDefaultKey = await sessionManager.readSession();
      expect(sessionFromDefaultKey).toEqual({ accessToken: "default-key-value" });
    });
  });

  describe("concurrent access safety", () => {
    it("should handle concurrent session saves safely", async () => {
      // Simulate saving sessions concurrently to test atomic operations
      const promises = [];
      for (let i = 0; i < 5; i++) {
        promises.push(
          sessionManager.saveSession({
            accessToken: `token-${i}`,
            refreshToken: `refresh-${i}`,
          })
        );
      }

      await Promise.all(promises);

      // The last saved session should be the one that remains
      const finalSession = await sessionManager.readSession();
      expect(finalSession).toEqual({
        accessToken: "token-4",
        refreshToken: "refresh-4",
      });
    });
  });
});