/**
 * Path: src/features/auth/schemas/validationSchemas.ts
 * Version: 1.0.0
 *
 * Centralized validation schemas using Zod for all DTOs and entities.
 * Zod provides:
 * - Type-safe validation with automatic TypeScript inference
 * - Detailed error messages
 * - Composable schemas
 * - Runtime validation without duplicating type definitions
 * - Input sanitization using transform methods
 */
import { z } from "zod";
export declare const EmailSchema: z.ZodPipe<z.ZodString, z.ZodTransform<string, string>>;
export declare const PasswordSchema: z.ZodPipe<z.ZodString, z.ZodTransform<string, string>>;
export declare const OtpSchema: z.ZodPipe<z.ZodString, z.ZodTransform<string, string>>;
export declare const ActionTokenSchema: z.ZodPipe<z.ZodString, z.ZodTransform<string, string>>;
export declare const LoginRequestSchema: z.ZodObject<{
    email: z.ZodPipe<z.ZodString, z.ZodTransform<string, string>>;
    password: z.ZodPipe<z.ZodString, z.ZodTransform<string, string>>;
}, z.core.$strip>;
export declare const RegisterRequestSchema: z.ZodObject<{
    email: z.ZodPipe<z.ZodString, z.ZodTransform<string, string>>;
    password: z.ZodPipe<z.ZodString, z.ZodTransform<string, string>>;
}, z.core.$strip>;
export declare const RequestOtpSchema: z.ZodObject<{
    email: z.ZodPipe<z.ZodString, z.ZodTransform<string, string>>;
}, z.core.$strip>;
export declare const VerifyOtpSchema: z.ZodObject<{
    email: z.ZodPipe<z.ZodString, z.ZodTransform<string, string>>;
    otp: z.ZodPipe<z.ZodString, z.ZodTransform<string, string>>;
}, z.core.$strip>;
export declare const CompleteRegistrationSchema: z.ZodObject<{
    actionToken: z.ZodPipe<z.ZodString, z.ZodTransform<string, string>>;
    newPassword: z.ZodPipe<z.ZodString, z.ZodTransform<string, string>>;
}, z.core.$strip>;
export declare const CompletePasswordResetSchema: z.ZodObject<{
    actionToken: z.ZodPipe<z.ZodString, z.ZodTransform<string, string>>;
    newPassword: z.ZodPipe<z.ZodString, z.ZodTransform<string, string>>;
}, z.core.$strip>;
export declare const ChangePasswordRequestSchema: z.ZodObject<{
    email: z.ZodPipe<z.ZodString, z.ZodTransform<string, string>>;
    newPassword: z.ZodPipe<z.ZodString, z.ZodTransform<string, string>>;
}, z.core.$strip>;
export declare const DeleteAccountRequestSchema: z.ZodObject<{
    email: z.ZodPipe<z.ZodString, z.ZodTransform<string, string>>;
}, z.core.$strip>;
export declare const RefreshRequestSchema: z.ZodPipe<z.ZodObject<{
    refreshToken: z.ZodString;
}, z.core.$strip>, z.ZodTransform<{
    refreshToken: string;
}, {
    refreshToken: string;
}>>;
export declare const LoginResponseSchema: z.ZodObject<{
    accessToken: z.ZodString;
    refreshToken: z.ZodString;
}, z.core.$strip>;
export declare const RefreshResponseDataSchema: z.ZodObject<{
    accessToken: z.ZodString;
}, z.core.$strip>;
export declare const UserProfileSchema: z.ZodObject<{
    id: z.ZodString;
    email: z.ZodPipe<z.ZodString, z.ZodTransform<string, string>>;
    name: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export declare const AuthSessionSchema: z.ZodObject<{
    accessToken: z.ZodString;
    refreshToken: z.ZodOptional<z.ZodString>;
    profile: z.ZodOptional<z.ZodObject<{
        id: z.ZodString;
        email: z.ZodPipe<z.ZodString, z.ZodTransform<string, string>>;
        name: z.ZodOptional<z.ZodString>;
    }, z.core.$strip>>;
}, z.core.$strip>;
export declare const ApiSuccessResponseSchema: z.ZodObject<{
    status: z.ZodNumber;
    message: z.ZodString;
    data: z.ZodUnknown;
}, z.core.$strip>;
export declare const LoginResponseSchemaWrapper: z.ZodObject<{
    status: z.ZodNumber;
    message: z.ZodString;
    data: z.ZodObject<{
        accessToken: z.ZodString;
        refreshToken: z.ZodString;
    }, z.core.$strip>;
}, z.core.$strip>;
export declare const RefreshResponseSchemaWrapper: z.ZodObject<{
    status: z.ZodNumber;
    message: z.ZodString;
    data: z.ZodObject<{
        accessToken: z.ZodString;
    }, z.core.$strip>;
}, z.core.$strip>;
export declare const ApiErrorResponseSchema: z.ZodObject<{
    status: z.ZodNumber;
    error: z.ZodString;
    errorId: z.ZodString;
    message: z.ZodString;
    path: z.ZodString;
}, z.core.$strip>;
export type ValidatedLoginRequest = z.infer<typeof LoginRequestSchema>;
export type ValidatedRegisterRequest = z.infer<typeof RegisterRequestSchema>;
export type ValidatedAuthSession = z.infer<typeof AuthSessionSchema>;
export type ValidatedUserProfile = z.infer<typeof UserProfileSchema>;
