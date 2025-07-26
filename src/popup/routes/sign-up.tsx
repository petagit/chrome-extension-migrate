import { SignUp } from "@clerk/chrome-extension"

export const SignUpPage = () => {
  return (
    <>
      <p>Sign Up</p>
      <SignUp
        routing="virtual"
        appearance={{
          elements: {
            socialButtonsRoot: "plasmo-hidden",
            dividerRow: "plasmo-hidden"
          }
        }}
      />
    </>
  )
} 