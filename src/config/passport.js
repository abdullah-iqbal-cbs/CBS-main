import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { Strategy as GitHubStrategy } from "passport-github2";
import { Strategy as FacebookStrategy } from "passport-facebook";
import { getHashedPassword, getPrismaClient } from "../utils/helpers.js";

const prisma = getPrismaClient();

// Pre-compute hashed dummy password
const hashedDummyPassword = await getHashedPassword(
    process.env.DUMMY_PASSWORD || "Password@123"
);

/**
 * Find or create user for OAuth authentication
 * @param {Object} params - User parameters
 * @returns {Promise<Object>} User object
 */
async function findOrCreateUser({ email, providerId, providerName, profile }) {
    const providerIdField = `${providerName}Id`;
    
    // Find existing user by email
    let user = await prisma.user.findFirst({
        where: { email: email ?? undefined }
    });

    if (!user) {
        // Create new user
        user = await prisma.user.create({
            data: {
                email,
                name: profile.displayName || "No Name",
                [providerIdField]: providerId,
                password: hashedDummyPassword,
                avatarUrl: profile.photos?.[0]?.value || 
                          (providerName === 'facebook' 
                              ? `https://graph.facebook.com/${providerId}/picture?type=large` 
                              : null),
                applicationId: '',
                emailVerified: providerName === 'google' ? true : undefined
            }
        });
    } else {
        // Update existing user with provider ID
        user = await prisma.user.update({
            where: { id: user.id },
            data: { [providerIdField]: providerId }
        });
    }

    // Update last login timestamp
    await prisma.user.update({
        where: { id: user.id },
        data: { lastLoginAt: new Date() }
    });

    return user;
}

/**
 * Configure Passport strategies
 * @returns {Object} Configured passport instance
 */
export default function configurePassport() {
    // Google OAuth Strategy
    passport.use(
        new GoogleStrategy(
            {
                clientID: process.env.GOOGLE_CLIENT_ID,
                clientSecret: process.env.GOOGLE_CLIENT_SECRET,
                callbackURL: process.env.GOOGLE_CALLBACK_URL,
                passReqToCallback: true
            },
            async (req, accessToken, refreshToken, profile, done) => {
                try {
                    const email = profile.emails?.[0]?.value || null;
                    
                    const user = await findOrCreateUser({
                        email,
                        providerId: profile.id,
                        providerName: 'google',
                        profile
                    });

                    return done(null, user);
                } catch (error) {
                    console.error("Google Auth Error:", error);
                    return done(error, null);
                }
            }
        )
    );

    // GitHub OAuth Strategy
    passport.use(
        new GitHubStrategy(
            {
                clientID: process.env.GITHUB_CLIENT_ID,
                clientSecret: process.env.GITHUB_CLIENT_SECRET,
                callbackURL: process.env.GITHUB_CALLBACK_URL || "/auth/github/callback"
            },
            async (accessToken, refreshToken, profile, done) => {
                try {
                    const email = profile.emails?.[0]?.value || null;
                    
                    const user = await findOrCreateUser({
                        email,
                        providerId: profile.id,
                        providerName: 'github',
                        profile
                    });

                    return done(null, user);
                } catch (error) {
                    console.error("GitHub Auth Error:", error);
                    return done(error, null);
                }
            }
        )
    );

    // Facebook OAuth Strategy
    passport.use(
        new FacebookStrategy(
            {
                clientID: process.env.FACEBOOK_CLIENT_ID,
                clientSecret: process.env.FACEBOOK_CLIENT_SECRET,
                callbackURL: process.env.FACEBOOK_CALLBACK_URL || "/auth/facebook/callback",
                profileFields: ["id", "emails", "name", "displayName", "photos"]
            },
            async (accessToken, refreshToken, profile, done) => {
                try {
                    const email = profile.emails?.[0]?.value || null;
                    
                    const user = await findOrCreateUser({
                        email,
                        providerId: profile.id,
                        providerName: 'facebook',
                        profile
                    });

                    return done(null, user);
                } catch (error) {
                    console.error("Facebook Auth Error:", error);
                    return done(error, null);
                }
            }
        )
    );

    // Session serialization
    passport.serializeUser((user, done) => {
        done(null, user.id);
    });

    // Session deserialization
    passport.deserializeUser(async (id, done) => {
        try {
            const user = await prisma.user.findUnique({ where: { id } });
            done(null, user);
        } catch (error) {
            console.error("Deserialize User Error:", error);
            done(error, null);
        }
    });

    return passport;
}