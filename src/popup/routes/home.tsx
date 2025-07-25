import { SignedIn, SignedOut } from "@clerk/chrome-extension";
import SubscriptionList from "../../features/newsubscriptionlist";
import LandingScreen from "../../components/LandingScreen";
import { useState } from "react";

export const Home = () => {
  const [refresh, setRefresh] = useState(false);
  return (
    <>
      <SignedIn>
        <SubscriptionList refresh={refresh} setRefresh={setRefresh} />
      </SignedIn>
      <SignedOut>
        <LandingScreen />
      </SignedOut>
    </>
  );
}; 