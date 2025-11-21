import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    secure: false,
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
});

export default async function sendEmail({ to, subject, html }) {
    return await transporter.sendMail({
        from: `"Reach CRM" <${process.env.SMTP_USER}>`,
        to,
        subject,
        html,
    });
}
