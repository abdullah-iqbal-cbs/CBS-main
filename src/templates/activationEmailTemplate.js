export const activationEmailTemplate = (name, url) => `
  <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
    <h2>Hello ${name},</h2>
    <p>Thank you for registering! Click below to activate your account:</p>

    <a href="${url}" 
       style="padding: 12px 20px; 
              background-color: #033304d4; 
              color: white; 
              text-decoration: none; 
              font-size: 16px; 
              border-radius: 6px;">
      Activate Account
    </a>

    <p style="margin-top: 20px;">
      If the button doesn't work, click the link below:
    </p>

    <p style="word-break: break-all;">${url}</p>

    <p style="margin-top: 30px;">Regards,<br/>Reach CRM Team</p>
  </div>
`;