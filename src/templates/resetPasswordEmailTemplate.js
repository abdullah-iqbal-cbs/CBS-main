export const resetPasswordEmailTemplate = (name, resetUrl) => {
    return `
        <div style="font-family: Arial, sans-serif; padding: 20px; background: #f7f7f7;">
            <div style="max-width: 600px; margin: auto; background: #ffffff; padding: 25px; border-radius: 8px;">
                
                <h2 style="color: #333; text-align: center;">Reset Your Password</h2>

                <p style="color: #555; font-size: 15px;">
                    Hi ${name || "there"},
                </p>

                <p style="color: #555; font-size: 15px; line-height: 1.6;">
                    We received a request to reset your password.  
                    Click the button below to choose a new password:
                </p>

                <div style="text-align: center; margin: 30px 0;">
                    <a href="${resetUrl}" 
                       style="background: #033304d4; padding: 12px 20px; color: #fff; 
                              text-decoration: none; border-radius: 5px; font-weight: bold;">
                        Reset Password
                    </a>
                </div>

                <p style="color: #555; font-size: 14px; line-height: 1.6;">
                    If the button doesn't work, copy and paste the link below into your browser:
                </p>

                <p style="word-break: break-all; font-size: 14px; color: #033304d4;">
                    ${resetUrl}
                </p>

                <p style="color: #555; font-size: 14px; margin-top: 25px;">
                    If you didn't request this, you can safely ignore this email.
                </p>

                <p style="color: #333; font-size: 14px; margin-top: 40px;">
                    Best regards,  
                    <br/>
                    <strong>Your Team</strong>
                </p>

            </div>
        </div>
    `;
};
