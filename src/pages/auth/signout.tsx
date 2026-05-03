import type { GetServerSideProps } from 'next';
import Link from 'next/link';
import { getCsrfToken, signOut } from 'next-auth/react';

type SignOutPageProps = {
    csrfToken: string | null;
};

export default function SignOutPage({ csrfToken }: SignOutPageProps) {
    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 p-4">
            <h1 className="text-3xl font-bold mb-4">Sign Out</h1>
            <p className="text-gray-600 mb-6">Are you sure you want to sign out?</p>

            <form method="post" action="/api/auth/signout" className="w-full max-w-sm">
                <input type="hidden" name="csrfToken" defaultValue={csrfToken ?? undefined} />
                <button
                    type="submit"
                    className="w-full px-4 py-2 bg-gray-900 text-white rounded hover:bg-black"
                >
                    Sign out
                </button>
            </form>

            <button
                type="button"
                className="mt-4 text-sm text-gray-600 underline"
                onClick={() => signOut({ callbackUrl: '/' })}
            >
                Sign out and go home
            </button>

            <Link href="/" className="mt-6 text-sm text-gray-600 underline">
                Cancel
            </Link>
        </div>
    );
}

export const getServerSideProps: GetServerSideProps<SignOutPageProps> = async (context) => {
    const csrfToken = await getCsrfToken(context);
    return { props: { csrfToken: csrfToken ?? null } };
};

