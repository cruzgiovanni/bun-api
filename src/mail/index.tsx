import { Resend } from "resend";
import { env } from "@/env";
import { render } from "@react-email/render";
import { VerifyEmailTemplate } from "./mail-template";

const resend = new Resend(env.RESEND_API_KEY);

export const sendVerificationEmail = async (
  email: string,
  username: string,
  verificationUrl: string,
) => {
  const html = await render(
    <VerifyEmailTemplate
      username={username}
      verificationUrl={verificationUrl}
    />,
  );

  await resend.emails.send({
    from: "no-reply@giovannicruz.dev",
    to: email,
    subject: "Verify your email",
    html,
  });
};
