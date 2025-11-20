const authErrors = {
    INVALID_CREDENTIALS: {
        code: "AUTH_001",
        httpStatus: 401,
        message: "Invalid email or password.",
        description: "Credentials provided do not match any user."
    },
    TOKEN_MISSING: {
        code: "AUTH_002",
        httpStatus: 401,
        message: "Authentication token is missing.",
        description: "No authorization token was provided in the request headers."
    },
    TOKEN_INVALID: {
        code: "AUTH_003",
        httpStatus: 401,
        message: "Authentication token is invalid.",
        description: "The provided token is malformed or signature verification failed."
    },
    TOKEN_EXPIRED: {
        code: "AUTH_004",
        httpStatus: 401,
        message: "Authentication token has expired.",
        description: "Token lifetime has ended; re-authentication is required."
    },
    REFRESH_TOKEN_INVALID: {
        code: "AUTH_005",
        httpStatus: 401,
        message: "Refresh token is invalid.",
        description: "Refresh token is revoked, malformed, or does not match the stored token."
    },
    REFRESH_TOKEN_EXPIRED: {
        code: "AUTH_006",
        httpStatus: 401,
        message: "Refresh token has expired.",
        description: "Refresh token lifetime has ended; user must re-authenticate."
    },
    USER_NOT_FOUND: {
        code: "AUTH_007",
        httpStatus: 404,
        message: "User not found.",
        description: "No account was found for the given identifier."
    },
    PERMISSION_DENIED: {
        code: "AUTH_008",
        httpStatus: 403,
        message: "Insufficient permissions.",
        description: "Authenticated user does not have the required role or scope."
    },
    ACCOUNT_LOCKED: {
        code: "AUTH_009",
        httpStatus: 423,
        message: "Account is locked.",
        description: "Account locked due to too many failed login attempts or administrative action."
    },
    ACCOUNT_DISABLED: {
        code: "AUTH_010",
        httpStatus: 403,
        message: "Account is disabled.",
        description: "Account has been suspended or disabled by an administrator."
    },
    EMAIL_NOT_VERIFIED: {
        code: "AUTH_011",
        httpStatus: 403,
        message: "Email address not verified.",
        description: "User must verify their email before accessing this resource."
    },
    DUPLICATE_EMAIL: {
        code: "AUTH_012",
        httpStatus: 409,
        message: "Email already in use.",
        description: "Tried to create or update an account with an email that already exists."
    },
    PASSWORD_TOO_WEAK: {
        code: "AUTH_013",
        httpStatus: 400,
        message: "Password does not meet complexity requirements.",
        description: "Provided password failed password policy validation."
    },
    PASSWORD_RESET_TOKEN_INVALID: {
        code: "AUTH_014",
        httpStatus: 400,
        message: "Password reset token is invalid.",
        description: "The password reset token is incorrect or has been used."
    },
    PASSWORD_RESET_TOKEN_EXPIRED: {
        code: "AUTH_015",
        httpStatus: 400,
        message: "Password reset token has expired.",
        description: "The password reset link has timed out and must be reissued."
    },
    MFA_REQUIRED: {
        code: "AUTH_016",
        httpStatus: 401,
        message: "Multi-factor authentication required.",
        description: "User must complete MFA to proceed with authentication."
    },
    MFA_FAILED: {
        code: "AUTH_017",
        httpStatus: 401,
        message: "Multi-factor authentication failed.",
        description: "Provided second factor is invalid or expired."
    },
    PROVIDER_NOT_SUPPORTED: {
        code: "AUTH_018",
        httpStatus: 400,
        message: "Authentication provider not supported.",
        description: "Requested OAuth/OpenID provider is not enabled or unknown."
    },
    LOGIN_RATE_LIMITED: {
        code: "AUTH_019",
        httpStatus: 429,
        message: "Too many login attempts. Try again later.",
        description: "Rate limiting applied due to excessive failed authentication attempts."
    },
    OAUTH_STATE_MISMATCH: {
        code: "AUTH_020",
        httpStatus: 400,
        message: "OAuth state mismatch.",
        description: "OAuth flow failed because state parameter does not match."
    },
    INVALID_AUTH_BODY: {
        code: "AUTH_021",
        httpStatus: 400,
        message: "Invalid authentication request body.",
        description: "Required authentication fields are missing or malformed."
    },
    SUSPICIOUS_ACTIVITY: {
        code: "AUTH_022",
        httpStatus: 403,
        message: "Suspicious activity detected.",
        description: "Authentication blocked pending review due to suspicious patterns."
    }
}

export default authErrors;