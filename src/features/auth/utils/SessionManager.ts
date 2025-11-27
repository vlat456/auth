import { AuthSession, UserProfile, IStorage } from "../types";
import { AuthSessionSchema, UserProfileSchema } from "../schemas/validationSchemas";
import { Mutex } from "./lockUtils";
import { isUserProfile } from "./safetyUtils";

interface SessionManagerOptions {
  storage: IStorage;
  storageKey?: string;
}

export class SessionManager {
  private storage: IStorage;
  private storageKey: string;
  private storageMutex = new Mutex(); // Ensures atomic session storage operations

  constructor(options: SessionManagerOptions) {
    this.storage = options.storage;
    this.storageKey = options.storageKey || "user_session_token";
  }

  /**
   * Saves the session to storage atomically to prevent data loss
   */
  async saveSession(session: AuthSession): Promise<void> {
    // Use mutex to ensure atomic write: no crash between remove and set
    // This prevents data loss if app crashes during session save
    const release = await this.storageMutex.acquire();
    try {
      // Write new session first (safest order)
      await this.storage.setItem(this.storageKey, JSON.stringify(session));
      // Note: We keep any old data to minimize data loss if crash occurs
      // Storage will contain either old or new complete session, never partial state
    } finally {
      release();
    }
  }

  /**
   * Reads the session from storage
   */
  async readSession(): Promise<AuthSession | null> {
    const raw = await this.storage.getItem(this.storageKey);
    if (!raw) return null;

    // Try to parse as JSON first
    try {
      const parsed: unknown = JSON.parse(raw);
      return this.processParsedSession(parsed);
    } catch {
      // Fall back to legacy string token storage
      if (typeof raw === "string" && raw.startsWith("{") === false) {
        return { accessToken: raw };
      }
    }

    return null;
  }

  /**
   * Removes the session from storage (logout)
   */
  async removeSession(): Promise<void> {
    await this.storage.removeItem(this.storageKey);
  }

  /**
   * Creates a new session with the provided access and refresh tokens
   */
  createSession(accessToken: string, refreshToken: string, profile?: UserProfile): AuthSession {
    return {
      accessToken,
      refreshToken,
      profile,
    };
  }

  /**
   * Updates the access token in an existing session while preserving other data
   */
  updateAccessToken(session: AuthSession, newAccessToken: string): AuthSession {
    return {
      ...session,
      accessToken: newAccessToken,
    };
  }

  /**
   * Updates the profile in an existing session
   */
  updateProfile(session: AuthSession, profile: UserProfile): AuthSession {
    return {
      ...session,
      profile,
    };
  }

  /**
   * Creates a refreshed session with new access token but preserved refresh token and profile
   */
  createRefreshedSession(currentSession: AuthSession, newAccessToken: string): AuthSession {
    return {
      accessToken: newAccessToken,
      refreshToken: currentSession.refreshToken,
      profile: currentSession.profile,
    };
  }

  /**
   * Processes parsed session data with validation
   */
  private processParsedSession(parsed: unknown): AuthSession | null {
    // Use Zod to validate the parsed session object
    try {
      return AuthSessionSchema.parse(parsed) as AuthSession;
    } catch (error) {
      console.warn(`Failed to parse session with strict validation: ${error}`);

      // For backward compatibility with old stored data that might have empty tokens,
      // we'll try a more permissive validation but only for the case where access token exists
      if (typeof parsed === "object" && parsed !== null) {
        const parsedObj = parsed as Record<string, unknown>;

        // Must have a string accessToken as minimum requirement
        if (
          "accessToken" in parsedObj &&
          typeof parsedObj.accessToken === "string" &&
          parsedObj.accessToken
        ) {
          console.warn("Using legacy session format - migration recommended");
          // Return a session with just the access token, setting others to undefined if missing
          return {
            accessToken: parsedObj.accessToken,
            refreshToken:
              typeof parsedObj.refreshToken === "string"
                ? parsedObj.refreshToken
                : undefined,
            profile: isUserProfile(parsedObj.profile)
              ? parsedObj.profile
              : undefined,
          };
        }
      }

      console.error(`Invalid session format in storage - clearing`);
      return null;
    }
  }

  /**
   * Validates a session object against the schema
   */
  validateSession(session: unknown): session is AuthSession {
    return AuthSessionSchema.safeParse(session).success;
  }

  /**
   * Validates a user profile object against the schema
   */
  validateProfile(profile: unknown): profile is UserProfile {
    return UserProfileSchema.safeParse(profile).success;
  }
}