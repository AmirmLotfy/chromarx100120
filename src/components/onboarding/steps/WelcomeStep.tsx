import { Globe } from "lucide-react";
import OnboardingStep from "../OnboardingStep";

const WelcomeStep = () => {
  return (
    <OnboardingStep
      title="Welcome to ChroMarx"
      description="Your all-in-one browser productivity companion"
      content="Let's get you set up with ChroMarx to enhance your browsing experience."
      icon={Globe}
    />
  );
};

export default WelcomeStep;