// SearchBar Component
import React from 'react';
import { MagnifyingGlassIcon, XMarkIcon } from '@heroicons/react/16/solid';
import useWindowSize from './Hooks/useWindowSize';

interface SearchBarProps {
    searchVal: string
    setSearchVal: (val: string) => void
    handleSearch: () => void
    totalRecipes: number
}

const SearchBar = ({ searchVal, setSearchVal, handleSearch, totalRecipes }: SearchBarProps) => {
    const { width } = useWindowSize(); // Get window width
    const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            handleSearch();
        }
    };

    return (
        <div className="w-full flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-3 py-2 shadow-sm focus-within:ring-2 focus-within:ring-emerald-400 focus-within:ring-offset-2">
            <div className="relative w-full flex items-center">
                {/* Magnifying Glass Icon */}
                <MagnifyingGlassIcon className="absolute left-3 h-5 w-5 text-slate-500" />

                {/* Input Field */}
                <input
                    className="w-full pl-10 pr-10 py-2 text-sm text-slate-900 placeholder-slate-500 bg-transparent border-none rounded-xl focus:outline-none"
                    placeholder={width < 565 ? 'Search recipes...' : 'Search recipes by name, ingredient, or type...'}
                    value={searchVal}
                    onChange={(e) => setSearchVal(e.target.value)}
                    onKeyDown={handleKeyPress}
                />

                {/* Clear Button (X Icon) */}
                {searchVal.trim() && (
                    <div className="absolute right-3 flex items-center space-x-1">
                        <button
                            className="rounded-full p-1 text-slate-500 hover:bg-slate-100 hover:text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:ring-offset-2"
                            onClick={() => setSearchVal('')}
                            aria-label="Clear search"
                        >
                            <XMarkIcon className="h-5 w-5" />
                        </button>
                        {
                            totalRecipes > 0 && <span className="text-xs text-slate-500 font-bold">{`(${totalRecipes})`}</span>
                        }
                    </div>
                )}
            </div>

            {/* Search Button */}
            <button
                className="shrink-0 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:ring-offset-2 transition-all"
                onClick={handleSearch}
            >
                Search
            </button>
        </div>
    );
};

export default SearchBar;
