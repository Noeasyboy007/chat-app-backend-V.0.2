import transporter, { emailConfig } from '../config/nodemailer.config.js';
import {
    VERIFICATION_EMAIL_TEMPLATE,
    WELCOME_EMAIL_TEMPLATE,
    PASSWORD_RESET_REQUEST_TEMPLATE,
    PASSWORD_RESET_SUCCESS_TEMPLATE
} from '../templete/emailTemplates.js';

export const sendVerificationEmail = async (email, verificationToken) => {
    try {
        await transporter.sendMail({
            from: emailConfig.from,
            to: email,
            subject: "Verify your email",
            html: VERIFICATION_EMAIL_TEMPLATE.replace("{verificationCode}", verificationToken)
        });
        console.log("Verification email sent successfully");
    } catch (error) {
        console.error("Error sending verification email:", error);
        throw new Error(`Error sending verification email: ${error.message}`);
    }
};

export const sendWelcomeEmail = async (email, name, loginURL) => {
    try {
        await transporter.sendMail({
            from: emailConfig.from,
            to: email,
            subject: "Welcome to Chat App",
            html: WELCOME_EMAIL_TEMPLATE.replace("{name}", name).replace("{loginURL}", loginURL)
        });
        console.log("Welcome email sent successfully");
    } catch (error) {
        console.error("Error sending welcome email:", error);
        throw new Error(`Error sending welcome email: ${error.message}`);
    }
};

export const sendResetPasswordEmail = async (email, resetURL) => {
    try {
        await transporter.sendMail({
            from: emailConfig.from,
            to: email,
            subject: "Reset your password",
            html: PASSWORD_RESET_REQUEST_TEMPLATE.replace("{resetURL}", resetURL)
        });
        console.log("Password reset email sent successfully");
    } catch (error) {
        console.error('Error sending password reset email:', error);
        throw new Error('Could not send reset password email');
    }
};

export const sendPasswordResetSuccessEmail = async (email) => {
    try {
        await transporter.sendMail({
            from: emailConfig.from,
            to: email,
            subject: "Password reset successful",
            html: PASSWORD_RESET_SUCCESS_TEMPLATE
        });
        console.log("Password reset success email sent");
    } catch (error) {
        console.error("Error sending password reset success email:", error);
        throw new Error('Could not send password reset success email');
    }
}; 