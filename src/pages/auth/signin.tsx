import type { GetServerSideProps } from 'next';
import Link from 'next/link';
import { getProviders, getCsrfToken, signIn } from 'next-auth/react';

type SignInPageProps = {
    csrfToken: string | null;
    providers: Awaited<ReturnType<typeof getProviders>>;
};

export default function SignInPage({ csrfToken, providers }: SignInPageProps) {
    const googleProvider = providers?.google;

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 p-4">
            <h1 className="text-3xl font-bold mb-4">Sign In</h1>
            <p className="text-gray-600 mb-6">Continue with your Google account.</p>

            <form method="post" action="/api/auth/signin/google" className="w-full max-w-sm">
                <input type="hidden" name="csrfToken" defaultValue={csrfToken ?? undefined} />
                <button
                    type="submit"
                    className="w-full px-4 py-2 bg-brand-500 text-white rounded hover:bg-brand-600 disabled:opacity-60"
                    disabled={!googleProvider}
                >
                    Sign in with Google
                </button>
            </form>

            {!googleProvider ? (
                <button
                    type="button"
                    className="mt-4 text-sm text-gray-500 underline"
                    onClick={() => signIn()}
                >
                    View available providers
                </button>
            ) : null}

            <Link href="/" className="mt-6 text-sm text-gray-600 underline">
                Back to Home
            </Link>
        </div>
    );
}

export const getServerSideProps: GetServerSideProps<SignInPageProps> = async (context) => {
    const [csrfToken, providers] = await Promise.all([
        getCsrfToken(context),
        getProviders(),
    ]);

    return {
        props: {
            csrfToken: csrfToken ?? null,
            providers: providers ?? null,
        },
    };
};

