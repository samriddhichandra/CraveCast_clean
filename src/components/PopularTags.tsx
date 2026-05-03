import { useState, useEffect, useMemo } from "react";
import useWindowSize from "./Hooks/useWindowSize";

interface Tag {
    _id: string;
    count: number;
}

interface PopularTagsProps {
    tags: Tag[];
    onTagToggle: (activeTag: string) => void;
    searchVal: string;
    loading?: boolean;
}

const chipStyles = [
    'bg-brand-100 text-brand-900 hover:bg-brand-200',
    'bg-orange-100 text-orange-900 hover:bg-orange-200',
    'bg-slate-100 text-slate-800 hover:bg-slate-200',
    'bg-emerald-100 text-emerald-900 hover:bg-emerald-200',
] as const;

const PopularTags = ({ tags, onTagToggle, searchVal, loading = false }: PopularTagsProps) => {
    const [activeTag, setActiveTag] = useState<string>('');

    const { width } = useWindowSize();

    useEffect(() => {
        if (!searchVal.trim()) {
            setActiveTag('');
        }
    }, [searchVal]);

    const handleTagClick = (tag: string) => {
        const newActiveTag = activeTag === tag ? '' : tag;
        setActiveTag(newActiveTag);
        onTagToggle(newActiveTag);
    };

    // Adjust tag display count based on screen size
    const sliceAmount = width < 640 ? 8 : width < 1024 ? 10 : 20;

    const visibleTags = useMemo(() => tags.slice(0, sliceAmount), [tags, sliceAmount]);

    return (
        <div className="w-full">
            <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold text-slate-900">Popular tags</h2>
                {loading ? (
                    <span className="text-xs font-medium text-slate-500">Loading…</span>
                ) : null}
            </div>

            <div className="mt-3 flex flex-wrap gap-2">
                {loading ? (
                    Array.from({ length: sliceAmount }).map((_, idx) => (
                        <div
                            key={idx}
                            className="h-8 w-24 rounded-full bg-[linear-gradient(110deg,#f1f5f9,45%,#ffffff,55%,#f1f5f9)] bg-[length:200%_100%] motion-safe:animate-shimmer"
                            aria-hidden="true"
                        />
                    ))
                ) : visibleTags.length === 0 ? (
                    <div className="rounded-2xl border border-slate-200 bg-white/60 px-4 py-3 text-sm text-slate-600">
                        No tags yet. Generate or save a recipe to start building trends.
                    </div>
                ) : (
                    visibleTags.map(({ _id, count }, idx) => (
                        <button
                            key={_id}
                            className={[
                                'inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold transition',
                                'focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:ring-offset-2',
                                activeTag === _id
                                    ? 'bg-emerald-700 text-white shadow-sm'
                                    : chipStyles[idx % chipStyles.length],
                            ].join(' ')}
                            onClick={() => handleTagClick(_id)}
                            aria-pressed={activeTag === _id}
                        >
                            <span className="truncate max-w-[9rem]">{_id}</span>
                            <span className="rounded-full bg-black/5 px-2 py-0.5 text-[11px] font-bold">
                                {count}
                            </span>
                        </button>
                    ))
                )}
            </div>
        </div>
    );
};

export default PopularTags;
