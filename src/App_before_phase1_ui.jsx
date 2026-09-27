import { useEffect, useMemo, useState } from "react";

const API_URL = "http://localhost:5000";

function useDebounced(value, delay = 300) {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debounced;
}

function formatPrice(price) {
  if (price === null || price === undefined || price === "") {
    return "Price not available";
  }

  const number = Number(price);

  if (Number.isNaN(number)) {
    return String(price);
  }

  return `₹${number.toLocaleString("en-IN", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })}`;
}

function normalizeName(name = "") {
  return name
    .toUpperCase()
    .replace(/[^A-Z0-9 ]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function getGroupKey(product) {
  return [
    normalizeName(product.product_name),
    product.packing || "",
    product.variant || "",
  ].join("||");
}

function groupProducts(products) {
  const map = new Map();

  for (const product of products) {
    const key = getGroupKey(product);

    if (!map.has(key)) {
      map.set(key, {
        key,
        name: product.product_name,
        packing: product.packing,
        variant: product.variant,
        items: [],
      });
    }

    map.get(key).items.push(product);
  }

  return Array.from(map.values());
}

function ProductComparison({ group }) {
  return (
    <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-slate-100">
        <h2 className="text-lg font-bold text-slate-900">
          {group.name}
        </h2>

        <div className="flex flex-wrap gap-2 mt-2">
          {group.packing && (
            <span className="px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 text-xs">
              Packing: {group.packing}
            </span>
          )}

          {group.variant && (
            <span className="px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 text-xs">
              {group.variant}
            </span>
          )}
        </div>
      </div>

      <div className="divide-y divide-slate-100">
        {group.items.map((product, index) => (
          <div
            key={`${product.company}-${product.product_code}-${index}`}
            className="px-5 py-4 flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-6"
          >
            <div className="flex-1">
              <div className="font-semibold text-slate-800">
                {product.company}
              </div>

              <div className="text-sm text-slate-500 mt-1">
                Code: {product.product_code || "—"}
              </div>

              {product.cas_number && (
                <div className="text-xs text-slate-400 mt-1">
                  CAS: {product.cas_number}
                </div>
              )}
            </div>

            <div className="text-left sm:text-right">
              <div className="text-xl font-bold text-slate-900">
                {formatPrice(product.price)}
              </div>

              <div className="text-xs text-slate-400 mt-1">
                {product.packing || "Pack not specified"}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function App() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [stats, setStats] = useState({
    products: 0,
    companies: 3,
  });

  const debouncedQuery = useDebounced(query, 300);

  // Get database statistics
  useEffect(() => {
    fetch(`${API_URL}/api/stats`)
      .then((response) => {
        if (!response.ok) {
          throw new Error("Stats request failed");
        }

        return response.json();
      })
      .then((data) => {
        setStats({
          products: data.products || 0,
          companies: data.companies || 3,
        });
      })
      .catch(() => {
        // Database may be empty before import.
      });
  }, []);

  // Search database
  useEffect(() => {
    const q = debouncedQuery.trim();

    if (!q) {
      setResults([]);
      setError("");
      return;
    }

    const controller = new AbortController();

    async function searchProducts() {
      try {
        setLoading(true);
        setError("");

        const response = await fetch(
          `${API_URL}/api/search?q=${encodeURIComponent(q)}`,
          {
            signal: controller.signal,
          }
        );

        if (!response.ok) {
          throw new Error("Search failed");
        }

        const data = await response.json();

        setResults(Array.isArray(data) ? data : []);
      } catch (err) {
        if (err.name !== "AbortError") {
          setError(
            "Unable to connect to the search server. Make sure the backend is running."
          );
        }
      } finally {
        setLoading(false);
      }
    }

    searchProducts();

    return () => controller.abort();
  }, [debouncedQuery]);

  const groups = useMemo(() => {
    return groupProducts(results);
  }, [results]);

  const suggestions = [
    "Acetone",
    "Sodium Chloride",
    "SC0001",
    "Acetic Acid",
    "Ethanol",
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-white text-slate-900">
      {/* Header */}
      <header className="border-b border-slate-200 bg-white/90 backdrop-blur">
        <div className="max-w-6xl mx-auto px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center text-xl font-bold">
              ₹
            </div>

            <div className="text-xl font-extrabold tracking-tight">
              PriceCompare<span className="text-cyan-500">Lab</span>
            </div>
          </div>

          <div className="hidden sm:flex items-center gap-3 text-sm text-slate-500">
            <span>
              {stats.products.toLocaleString()} products
            </span>

            <span>•</span>

            <span>{stats.companies} companies</span>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="max-w-6xl mx-auto px-5">
        <section className="pt-14 pb-10 text-center">
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight">
            Compare{" "}
            <span className="text-cyan-500">
              Product Prices
            </span>
          </h1>

          <p className="mt-4 text-slate-500 max-w-2xl mx-auto">
            Search a product by code or name and compare prices
            across all available companies.
          </p>

          {/* Search */}
          <div className="mt-8 max-w-3xl mx-auto">
            <div className="flex items-center bg-white rounded-2xl shadow-lg border border-slate-200 px-5 py-4 focus-within:ring-2 focus-within:ring-cyan-400">
              <span className="text-xl mr-3">🔍</span>

              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search by Product Code or Product Name"
                className="w-full outline-none text-base sm:text-lg bg-transparent placeholder:text-slate-400"
                autoFocus
              />

              {query && (
                <button
                  onClick={() => setQuery("")}
                  className="text-slate-400 hover:text-slate-700 px-2"
                >
                  ✕
                </button>
              )}
            </div>

            {!query && (
              <div className="mt-4 flex flex-wrap justify-center gap-2">
                {suggestions.map((item) => (
                  <button
                    key={item}
                    onClick={() => setQuery(item)}
                    className="px-3 py-1.5 rounded-full bg-slate-100 hover:bg-cyan-50 hover:text-cyan-700 text-sm text-slate-600 transition"
                  >
                    {item}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Stats */}
          <div className="mt-9 flex flex-wrap justify-center gap-4">
            <div className="bg-white border border-slate-200 rounded-xl px-7 py-4 shadow-sm">
              <div className="text-2xl font-bold">
                {stats.companies}
              </div>
              <div className="text-sm text-slate-500">
                Companies
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl px-7 py-4 shadow-sm">
              <div className="text-2xl font-bold">
                {stats.products.toLocaleString()}
              </div>
              <div className="text-sm text-slate-500">
                Products
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl px-7 py-4 shadow-sm">
              <div className="text-2xl font-bold">
                Fast
              </div>
              <div className="text-sm text-slate-500">
                Database Search
              </div>
            </div>
          </div>
        </section>

        {/* Results */}
        <section className="pb-24">
          {debouncedQuery.trim() && (
            <div className="mb-5 text-sm text-slate-500">
              {loading
                ? "Searching products..."
                : `${groups.length} comparison results for "${debouncedQuery}"`}
            </div>
          )}

          {error && (
            <div className="mb-5 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">
              {error}
            </div>
          )}

          {!loading &&
            groups.map((group) => (
              <div key={group.key} className="mb-5">
                <ProductComparison group={group} />
              </div>
            ))}

          {!loading &&
            debouncedQuery.trim() &&
            groups.length === 0 &&
            !error && (
              <div className="text-center py-16">
                <div className="text-5xl mb-4">🔎</div>

                <h2 className="text-xl font-bold text-slate-800">
                  No matching products found
                </h2>

                <p className="mt-2 text-slate-500">
                  Try another product name, product code, or CAS number.
                </p>
              </div>
            )}

          {!debouncedQuery.trim() && (
            <div className="text-center mt-12 text-slate-400 text-sm">
              Search the database to compare company-wise prices.
            </div>
          )}
        </section>
      </main>

      <footer className="text-center text-xs text-slate-400 pb-8">
        Prices are displayed from the uploaded company price lists.
      </footer>
    </div>
  );
}