import Link from 'next/link';

export default function VerifyRequestPage() {
    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 p-4">
            <h1 className="text-3xl font-bold mb-4">Check your email</h1>
            <p className="text-gray-600 mb-6">
                A sign in link has been sent to your email address.
            </p>
            <Link href="/" className="mt-4 px-4 py-2 bg-brand-500 text-white rounded hover:bg-brand-600">
                Go to Home
            </Link>
        </div>
    );
}

