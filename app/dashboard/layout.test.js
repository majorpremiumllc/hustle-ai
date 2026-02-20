
import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react';
import DashboardLayout from './layout';
import { signOut } from 'next-auth/react';
import { Capacitor } from '@capacitor/core';
import { Preferences } from '@capacitor/preferences';
import { usePathname, useRouter } from 'next/navigation';

jest.mock('./dashboard.module.css', () => ({}));

jest.mock('../components/NeuralSplash', () => () => <div data-testid="neural-splash-mock" />);
jest.mock('next/navigation', () => ({
    __esModule: true,
    usePathname: jest.fn(),
    useRouter: jest.fn(() => ({ push: jest.fn(), replace: jest.fn() })),
}));

jest.mock('next-auth/react', () => ({
    SessionProvider: ({ children }) => <>{children}</>,
    signOut: jest.fn(),
    useSession: jest.fn(() => ({ data: null, status: 'unauthenticated' })),
}));

jest.mock('@capacitor/core', () => ({
    Capacitor: {
        isNativePlatform: jest.fn(),
        getPlatform: jest.fn(),
    },
}));

jest.mock('@capacitor/preferences', () => ({
    Preferences: {
        clear: jest.fn(),
    },
}));

describe('DashboardLayout sign-out on iOS', () => {
    // Mock matchMedia for InstallPrompt
    window.matchMedia = jest.fn().mockImplementation(query => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: jest.fn(),
        removeListener: jest.fn(),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        dispatchEvent: jest.fn(),
    }));
    // Mock fetch for subscription
    global.fetch = jest.fn().mockResolvedValue({
        json: async () => ({ status: 'active' }),
    });
    // Mock Capacitor platform detection
    Capacitor.isNativePlatform.mockReturnValue(true);
    Capacitor.getPlatform.mockReturnValue('ios');
    usePathname.mockReturnValue('/dashboard');
    Preferences.clear.mockResolvedValue(undefined);


    it('clears storage and calls signOut without redirect on native iOS', async () => {
        const mockReplace = jest.fn();
        useRouter.mockReturnValue({ push: jest.fn(), replace: mockReplace });
        signOut.mockResolvedValue(undefined);

        const { getByRole } = render(<DashboardLayout><div>Test</div></DashboardLayout>);
        const signOutButton = getByRole('button', { name: /sign out/i });
        fireEvent.click(signOutButton);
        await waitFor(() => {
            expect(Preferences.clear).toHaveBeenCalled();
            expect(signOut).toHaveBeenCalledWith({ redirect: false });
            expect(mockReplace).toHaveBeenCalledWith('/');
        });
    });
});
