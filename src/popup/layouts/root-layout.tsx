import { Link, Outlet, useNavigate } from 'react-router-dom';
import { ClerkProvider, SignedIn, SignedOut, UserButton } from '@clerk/chrome-extension';

import logo from '~/assets/logo.svg';

const PUBLISHABLE_KEY = process.env.PLASMO_PUBLIC_CLERK_PUBLISHABLE_KEY;

if (!PUBLISHABLE_KEY) {
  throw new Error('Please add the PLASMO_PUBLIC_CLERK_PUBLISHABLE_KEY to the .env.development file');
}

const SYNC_HOST = process.env.PLASMO_PUBLIC_CLERK_SYNC_HOST

if (!PUBLISHABLE_KEY || !SYNC_HOST) {
  throw new Error(
    'Please add the PLASMO_PUBLIC_CLERK_PUBLISHABLE_KEY and PLASMO_PUBLIC_CLERK_SYNC_HOST to the .env.development file',
  )
}

export const RootLayout = () => {
  const navigate = useNavigate();

  return (
    <ClerkProvider
      routerPush={(to) => navigate(to)}
      routerReplace={(to) => navigate(to, { replace: true })}
      publishableKey={PUBLISHABLE_KEY}
      afterSignOutUrl="/"
      syncHost={SYNC_HOST}>
      <div className="plasmo-w-[800px] plasmo-h-[600px]">
        <header>
          <SignedIn>
            <div className="flex items-center justify-between gap-4 p-4">
              <img src={logo} alt="logo" />
              <div className="flex items-center gap-4">
                <Link to="/settings">Settings</Link>
                <UserButton />
              </div>
            </div>
          </SignedIn>
        </header>
        <main>
          <Outlet />
        </main>
        <footer>
          <SignedOut>
          </SignedOut>
        </footer>
      </div>
    </ClerkProvider>
  );
}; 