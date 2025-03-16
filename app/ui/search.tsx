"use client";

import { useDebouncedCallback } from "use-debounce";
import { MagnifyingGlassIcon } from "@heroicons/react/24/outline";
import { useSearchParams, usePathname, useRouter } from "next/navigation";

interface SearchProps {
  // Define the SearchProps interface with a placeholder prop
  placeholder: string;
}

const Search: React.FC<SearchProps> = ({ placeholder }) => {
  // Define the Search component with a placeholder prop
  const searchParams = useSearchParams();

  // Get the current pathname/path
  const pathname = usePathname();
  const { replace } = useRouter(); // Get the router object

  // Handle the search
  const handleSearch = useDebouncedCallback((term) => {
    console.log(`Searching ...: ${term}`); // Log the search term

    const params = new URLSearchParams(searchParams); // Create a new URLSearchParams object where serachParams is the initial value
    params.set("page", "1"); // Set the page to 1

    if (term) {
      params.set("query", term);
    } else {
      params.delete("query");
    }
    replace(`${pathname}?${params.toString()}`);
  }, 300);

  return (
    <div className="relative flex flex-1 flex-shrink-0">
      <label htmlFor="search" className="sr-only">
        Search
      </label>
      <input
        className="peer block w-full rounded-md border border-gray-200 py-[9px] pl-10 text-sm outline-2 placeholder:text-gray-500"
        placeholder={placeholder} // Use the placeholder prop
        onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
          handleSearch(e.target.value);
        }}
        defaultValue={searchParams.get("query")?.toString()}
      />
      <MagnifyingGlassIcon className="absolute left-3 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-gray-500 peer-focus:text-gray-900" />
    </div>
  );
};

export default Search;
