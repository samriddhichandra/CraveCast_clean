import { useEffect, useState, useRef, useCallback } from 'react';
import { ClockIcon, FireIcon } from '@heroicons/react/24/solid';
import SearchBar from '../components/SearchBar';
import ViewRecipes from '../components/Recipe_Display/ViewRecipes';
import FloatingActionButtons from '../components/FloatingActionButtons';
import Loading from '../components/Loading';
import PopularTags from '../components/PopularTags';
import { usePagination } from '../components/Hooks/usePagination';

const Home = () => {
    const [searchVal, setSearchVal] = useState('');
    const [sortOption, setSortOption] = useState<'recent' | 'popular'>('popular');
    const [searchTrigger, setSearchTrigger] = useState<true | false>(false);

    const observerRef = useRef<IntersectionObserver | null>(null);
    const searchTimeout = useRef<NodeJS.Timeout | null>(null);
    const lastRecipeRef = useRef<HTMLDivElement | null>(null);

    const isSearching = searchVal.trim() !== "";
    const endpoint = isSearching ? "/api/search-recipes" : "/api/get-recipes";

    const {
        data: latestRecipes,
        loading,
        error,
        popularTags,
        loadMore,
        handleRecipeListUpdate,
        totalRecipes,
        page,
        totalPages
    } = usePagination({
        endpoint,
        sortOption,
        searchQuery: searchVal.trim(),
        searchTrigger,
        resetSearchTrigger: () => setSearchTrigger(false),
    });
    useEffect(() => {
        if (!latestRecipes.length) return;

        const lastRecipeElement = lastRecipeRef.current;
        if (!lastRecipeElement) return;

        if (observerRef.current) observerRef.current.disconnect();

        observerRef.current = new IntersectionObserver((entries) => {
            if (entries[0]?.isIntersecting && !loading && page < totalPages) {
                loadMore();
                if (searchVal.trim() && !searchTrigger) {
                    setSearchTrigger(true);
                }
            }
        }, { threshold: 0.5 });

        observerRef.current.observe(lastRecipeElement);

        return () => {
            if (observerRef.current) {
                observerRef.current.disconnect();
                observerRef.current = null; // Ensure observerRef is fully reset
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [latestRecipes, loading]);

    const handleSearch = useCallback(() => {
        if (!searchVal.trim()) return;

        if (searchTimeout.current) {
            clearTimeout(searchTimeout.current);
            searchTimeout.current = null; // Explicitly reset the timeout reference
        }

        searchTimeout.current = setTimeout(() => {
            setSearchTrigger(true);
        }, 500);
    }, [searchVal]);

    const sortRecipes = (option: 'recent' | 'popular') => {
        if (sortOption === option || isSearching) return;
        setSortOption(option);
        setSearchTrigger(true);
    };

    const handleTagSearch = async (tag: string) => {
        if (searchVal === tag) {
            setSearchVal(""); // Reset search if clicking the same tag
            return;
        }

        setSearchVal(tag);
        setSearchTrigger(true);
    };

    const showRecipeSkeletons = loading && latestRecipes.length === 0;
    const showEmptyState = !loading && latestRecipes.length === 0;
    const tagsLoading = loading && popularTags.length === 0;

    return (
        <div className="min-h-screen bg-gradient-to-b from-brand-50 via-white to-white">
            {/* Hero */}
            <section className="relative overflow-hidden motion-safe:animate-fadeIn">
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(236,72,153,0.18),transparent_55%)]" />
                <div className="absolute -top-24 -right-24 h-72 w-72 rounded-full bg-gradient-to-br from-brand-300/30 to-brand-100/30 blur-2xl motion-safe:animate-floatSlow" />
                <div className="absolute -bottom-24 -left-24 h-72 w-72 rounded-full bg-gradient-to-tr from-brand-200/30 to-brand-100/30 blur-2xl motion-safe:animate-floatSlow" />

                <div className="relative mx-auto w-full max-w-7xl px-4 pb-10 pt-10 sm:px-6 lg:px-8 lg:pb-14 lg:pt-14">
                    <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 lg:items-center">
                        <div className="lg:col-span-5">
                            <div className="inline-flex items-center gap-2 rounded-full border border-brand-200 bg-white/70 px-3 py-1 text-xs font-semibold text-brand-800 shadow-sm backdrop-blur">
                                <span className="h-1.5 w-1.5 rounded-full bg-brand-500" />
                                CraveCast • Discover your next favorite recipe
                            </div>
                            <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl motion-safe:animate-fadeInUp">
                                Premium recipe discovery, powered by AI
                            </h1>
                            <p className="mt-3 text-sm leading-6 text-slate-600 sm:text-base">
                                Search by name, ingredients, or cuisine. Browse what&apos;s trending, save favorites, and create new recipes in seconds.
                            </p>
                            <div className="mt-6 flex flex-wrap items-center gap-2 text-xs text-slate-600">
                                <span className="rounded-full bg-brand-100 px-3 py-1 font-medium text-brand-900">Fast search</span>
                                <span className="rounded-full bg-brand-100 px-3 py-1 font-medium text-brand-900">Popular tags</span>
                                <span className="rounded-full bg-slate-100 px-3 py-1 font-medium text-slate-800">Most recent & popular</span>
                            </div>
                        </div>

                        <div className="lg:col-span-7">
                            <div className="rounded-3xl border border-brand-100 bg-white/70 p-4 shadow-xl shadow-brand-100/40 backdrop-blur sm:p-6">
                                <div className="flex items-center justify-between gap-3">
                                    <div>
                                        <h2 className="text-sm font-semibold text-slate-900">Find recipes</h2>
                                        <p className="mt-0.5 text-xs text-slate-600">Try “pasta”, “chicken”, “vegan”, “thai”...</p>
                                    </div>
                                    <div className="hidden sm:flex items-center gap-2 rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-800">
                                        <span className="h-1.5 w-1.5 rounded-full bg-brand-500" />
                                        {totalRecipes} results
                                    </div>
                                </div>

                                <div className="mt-4">
                                    <SearchBar
                                        searchVal={searchVal}
                                        setSearchVal={setSearchVal}
                                        handleSearch={handleSearch}
                                        totalRecipes={totalRecipes}
                                    />
                                </div>

                                <div className="mt-5">
                                    <PopularTags
                                        tags={popularTags}
                                        onTagToggle={handleTagSearch}
                                        searchVal={searchVal}
                                        loading={tagsLoading}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Content */}
            <main className="mx-auto w-full max-w-7xl px-4 pb-16 sm:px-6 lg:px-8">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-2">
                        <h2 className="text-base font-semibold text-slate-900">
                            {isSearching ? 'Search results' : 'Discover'}
                        </h2>
                        <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">
                            {totalRecipes}
                        </span>
                    </div>

                    {/* Sorting Buttons */}
                    <div className="inline-flex rounded-2xl border border-slate-200 bg-white p-1 shadow-sm">
                        <button
                            onClick={() => sortRecipes('recent')}
                            className={[
                                'group inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold transition',
                                'focus:outline-none focus:ring-2 focus:ring-brand-400 focus:ring-offset-2',
                                'disabled:cursor-not-allowed disabled:opacity-50',
                                sortOption === 'recent'
                                    ? 'bg-brand-600 text-white shadow'
                                    : 'text-slate-700 hover:bg-slate-50',
                            ].join(' ')}
                            disabled={Boolean(searchVal.trim())}
                            aria-pressed={sortOption === 'recent'}
                        >
                            <ClockIcon className="h-4 w-4" />
                            Most Recent
                        </button>
                        <button
                            onClick={() => sortRecipes('popular')}
                            className={[
                                'group inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold transition',
                                'focus:outline-none focus:ring-2 focus:ring-brand-400 focus:ring-offset-2',
                                'disabled:cursor-not-allowed disabled:opacity-50',
                                sortOption === 'popular'
                                    ? 'bg-brand-600 text-white shadow'
                                    : 'text-slate-700 hover:bg-slate-50',
                            ].join(' ')}
                            disabled={Boolean(searchVal.trim())}
                            aria-pressed={sortOption === 'popular'}
                        >
                            <FireIcon className="h-4 w-4" />
                            Most Popular
                        </button>
                    </div>
                </div>

                {error ? (
                    <div className="mt-4 rounded-2xl border border-orange-200 bg-orange-50 px-4 py-3 text-sm text-orange-900">
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                            <div>
                                <div className="font-bold">Couldn’t load recipes</div>
                                <div className="text-orange-800/80">
                                    Check your connection and ensure the API is reachable (in production, set a correct domain for `NEXT_PUBLIC_API_BASE_URL` or rely on same-origin routes).
                                </div>
                            </div>
                            <button
                                onClick={() => setSearchTrigger(true)}
                                className="inline-flex items-center justify-center rounded-xl bg-orange-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-300 focus:ring-offset-2"
                            >
                                Retry
                            </button>
                        </div>
                        <div className="mt-2 text-xs text-orange-800/70 break-words">{error}</div>
                    </div>
                ) : null}

                {/* Grid / states */}
                <div className="mt-6">
                    {showRecipeSkeletons ? (
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                            {Array.from({ length: 8 }).map((_, idx) => (
                                <div
                                    key={idx}
                                    className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden"
                                    aria-hidden="true"
                                >
                                    <div className="h-44 w-full bg-[linear-gradient(110deg,#e2e8f0,45%,#f1f5f9,55%,#e2e8f0)] bg-[length:200%_100%] motion-safe:animate-shimmer" />
                                    <div className="p-4">
                                        <div className="h-4 w-3/4 rounded bg-[linear-gradient(110deg,#e2e8f0,45%,#f1f5f9,55%,#e2e8f0)] bg-[length:200%_100%] motion-safe:animate-shimmer" />
                                        <div className="mt-3 h-3 w-full rounded bg-[linear-gradient(110deg,#f1f5f9,45%,#ffffff,55%,#f1f5f9)] bg-[length:200%_100%] motion-safe:animate-shimmer" />
                                        <div className="mt-2 h-3 w-5/6 rounded bg-[linear-gradient(110deg,#f1f5f9,45%,#ffffff,55%,#f1f5f9)] bg-[length:200%_100%] motion-safe:animate-shimmer" />
                                        <div className="mt-4 flex gap-2">
                                            <div className="h-7 w-20 rounded-full bg-[linear-gradient(110deg,#f1f5f9,45%,#ffffff,55%,#f1f5f9)] bg-[length:200%_100%] motion-safe:animate-shimmer" />
                                            <div className="h-7 w-16 rounded-full bg-[linear-gradient(110deg,#f1f5f9,45%,#ffffff,55%,#f1f5f9)] bg-[length:200%_100%] motion-safe:animate-shimmer" />
                                        </div>
                                        <div className="mt-4 flex items-center justify-between">
                                            <div className="h-9 w-28 rounded-xl bg-[linear-gradient(110deg,#e2e8f0,45%,#f1f5f9,55%,#e2e8f0)] bg-[length:200%_100%] motion-safe:animate-shimmer" />
                                            <div className="h-9 w-16 rounded-xl bg-[linear-gradient(110deg,#f1f5f9,45%,#ffffff,55%,#f1f5f9)] bg-[length:200%_100%] motion-safe:animate-shimmer" />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : showEmptyState ? (
                        <div className="rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm">
                            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-50 text-brand-700">
                                <FireIcon className="h-6 w-6" />
                            </div>
                            <h3 className="mt-4 text-lg font-bold text-slate-900">No recipes found</h3>
                            <p className="mt-1 text-sm text-slate-600">
                                Try searching for <span className="font-semibold text-slate-700">pasta</span>, <span className="font-semibold text-slate-700">chicken</span>, <span className="font-semibold text-slate-700">vegan</span>, or <span className="font-semibold text-slate-700">thai</span>.
                            </p>
                            <p className="mt-3 text-sm text-slate-600">
                                Or create something new — we&apos;ll help you generate recipes and images.
                            </p>
                            <div className="mt-6 flex items-center justify-center gap-3">
                                <button
                                    onClick={() => {
                                        setSearchVal('');
                                        setSearchTrigger(true);
                                    }}
                                    className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-800 shadow-sm hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-brand-400 focus:ring-offset-2"
                                >
                                    Clear search
                                </button>
                                <a
                                    href="/CreateRecipe"
                                    className="inline-flex items-center justify-center rounded-xl bg-brand-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-brand-400 focus:ring-offset-2"
                                >
                                    Create a recipe
                                </a>
                            </div>
                        </div>
                    ) : (
                        <ViewRecipes
                            recipes={latestRecipes}
                            handleRecipeListUpdate={handleRecipeListUpdate}
                            lastRecipeRef={lastRecipeRef}
                        />
                    )}
                </div>

                {/* Show loading indicator when fetching (pagination) */}
                {loading && latestRecipes.length > 0 ? (
                    <div className="mt-6">
                        <Loading />
                    </div>
                ) : null}
            </main>

            <FloatingActionButtons />
        </div>
    );
};

export default Home;
