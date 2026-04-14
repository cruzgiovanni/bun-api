import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Section,
  Text,
} from "@react-email/components";

interface VerifyEmailProps {
  username: string;
  verificationUrl: string;
}

export function VerifyEmailTemplate({
  username,
  verificationUrl,
}: VerifyEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>Confirme seu endereço de email</Preview>
      <Body style={{ backgroundColor: "#f4f4f5", fontFamily: "sans-serif" }}>
        <Container style={{ margin: "40px auto", maxWidth: "480px" }}>
          <Section
            style={{
              backgroundColor: "#ffffff",
              borderRadius: "8px",
              padding: "40px",
            }}
          >
            <Heading
              style={{
                fontSize: "24px",
                color: "#18181b",
                marginBottom: "8px",
              }}
            >
              Verifique seu email
            </Heading>
            <Text style={{ color: "#71717a", fontSize: "16px" }}>
              Olá, {username}. Clique no botão abaixo para confirmar seu
              endereço de email.
            </Text>
            <Button
              href={verificationUrl}
              style={{
                backgroundColor: "#18181b",
                color: "#ffffff",
                borderRadius: "6px",
                padding: "12px 24px",
                fontSize: "14px",
                fontWeight: "bold",
                display: "block",
                textAlign: "center",
                marginTop: "24px",
              }}
            >
              Confirmar email
            </Button>
            <Text
              style={{ color: "#a1a1aa", fontSize: "12px", marginTop: "24px" }}
            >
              Se você não criou uma conta, ignore este email.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}
