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

  return `Rs. ${number.toLocaleString("en-IN", {
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

function ProductComparison({ group, onAddToCart, cart }) {
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
        {group.items.map((product, index) => {
          const cartItem = cart.find((item) => item.id === product.id);

          return (
            <div
              key={`${product.company}-${product.product_code}-${index}`}
              className="px-5 py-4 flex flex-col lg:flex-row lg:items-center gap-4"
            >
              <div className="flex-1">
                <div className="font-semibold text-slate-800">
                  {product.company}
                </div>

                <div className="text-sm text-slate-500 mt-1">
                  Code: {product.product_code || "�"}
                </div>

                {product.cas_number && (
                  <div className="text-xs text-slate-400 mt-1">
                    CAS: {product.cas_number}
                  </div>
                )}

                {product.hsn_code && (
                  <div className="text-xs text-slate-400 mt-1">
                    HSN: {product.hsn_code}
                  </div>
                )}
              </div>

              <div className="lg:text-right">
                <div className="text-xl font-bold text-slate-900">
                  {formatPrice(product.price)}
                </div>

                <div className="text-xs text-slate-400 mt-1">
                  {product.packing || "Pack not specified"}
                </div>
              </div>

              <div className="flex items-center gap-2">
                {cartItem && (
                  <div className="flex items-center border border-slate-200 rounded-lg overflow-hidden">
                    <button
                      onClick={() =>
                        onAddToCart(product, -1)
                      }
                      className="px-3 py-2 hover:bg-slate-100"
                    >
                      -
                    </button>

                    <span className="px-3 font-semibold">
                      {cartItem.quantity}
                    </span>

                    <button
                      onClick={() =>
                        onAddToCart(product, 1)
                      }
                      className="px-3 py-2 hover:bg-slate-100"
                    >
                      +
                    </button>
                  </div>
                )}

                {!cartItem && (
                  <button
                    onClick={() => onAddToCart(product, 1)}
                    className="px-4 py-2.5 rounded-xl bg-slate-900 text-white text-sm font-semibold hover:bg-cyan-600 transition"
                  >
                    + Add to Cart
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>    </div>
  );
}

function Cart({ cart, onAddToCart, onRemove }) {
  const total = cart.reduce((sum, item) => {
    const price = Number(item.price) || 0;
    return sum + price * item.quantity;
  }, 0);

  return (
    <div className="fixed bottom-5 right-5 w-[calc(100%-40px)] sm:w-96 bg-white border border-slate-200 rounded-2xl shadow-2xl z-50 overflow-hidden">
      <div className="px-5 py-4 bg-slate-900 text-white flex items-center justify-between">
        <div>
          <div className="font-bold">Cart</div>
          <div className="text-xs text-slate-300">
            {cart.length} product{cart.length !== 1 ? "s" : ""}
          </div>
        </div>

        <div className="text-lg font-bold">
          {formatPrice(total)}
        </div>
      </div>

      <div className="max-h-80 overflow-y-auto">
        {cart.length === 0 ? (
          <div className="p-6 text-center text-slate-400 text-sm">
            Cart is empty
          </div>
        ) : (
          cart.map((item) => (
            <div
              key={item.id}
              className="p-4 border-b border-slate-100"
            >
              <div className="font-semibold text-sm text-slate-800">
                {item.product_name}
              </div>

              <div className="text-xs text-slate-500 mt-1">
                {item.company} � {item.product_code || "No code"}
              </div>

              <div className="flex items-center justify-between mt-3">
                <div className="flex items-center border border-slate-200 rounded-lg overflow-hidden">
                  <button
                    onClick={() => onAddToCart(item, -1)}
                    className="px-2.5 py-1.5 hover:bg-slate-100"
                  >
                    -
                  </button>

                  <span className="px-3 text-sm font-semibold">
                    {item.quantity}
                  </span>

                  <button
                    onClick={() => onAddToCart(item, 1)}
                    className="px-2.5 py-1.5 hover:bg-slate-100"
                  >
                    +
                  </button>
                </div>

                <div className="font-bold text-sm">
                  {formatPrice(
                    (Number(item.price) || 0) * item.quantity
                  )}
                </div>

                <button
                  onClick={() => onRemove(item.id)}
                  className="text-red-500 text-xs hover:text-red-700"
                >
                  Remove
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {cart.length > 0 && (
        <div className="p-4 border-t border-slate-200">
          <button
            className="w-full py-3 rounded-xl bg-cyan-500 text-white font-bold hover:bg-cyan-600 transition"
            onClick={() =>
              setShowQuotation(true)
            }
          >
            Continue to Quotation
          </button>
        </div>
      )}    </div>
  );
}

function PdfResults({ pdfResults }) {
  if (!pdfResults || pdfResults.length === 0) return null;

  return (
    <div className="mb-5 bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-slate-100">
        <h2 className="text-lg font-bold text-slate-900">PDF Search Results</h2>
        <p className="text-sm text-slate-500 mt-1">Matching content from imported company PDFs</p>
      </div>
      <div className="divide-y divide-slate-100">
        {pdfResults.map((item) => (
          <div key={item.id} className="px-5 py-4">
            <div className="font-semibold text-slate-900">{item.company}</div>
            <div className="text-xs text-slate-500 mt-1">Chunk {item.page_number}</div>
            <div className="text-sm text-slate-600 whitespace-pre-wrap break-words mt-2 max-h-40 overflow-hidden">{item.content}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function QuotationForm({ cart, customer, setCustomer, onBack }) {
  return (
    <div className="max-w-6xl mx-auto px-5 py-8">
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="px-6 py-5 bg-slate-900 text-white flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">Quotation</h2>
            <p className="text-sm text-slate-300 mt-1">Enter customer details</p>
          </div>
          <button
            onClick={onBack}
            className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 transition"
          >
            ? Back
          </button>
        </div>

        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-5">
          <input
            value={customer.name}
            onChange={(e) => setCustomer({ ...customer, name: e.target.value })}
            placeholder="Customer Name"
            className="border border-slate-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-cyan-400"
          />

          <input
            value={customer.company}
            onChange={(e) => setCustomer({ ...customer, company: e.target.value })}
            placeholder="Company"
            className="border border-slate-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-cyan-400"
          />

          <input
            value={customer.mobile}
            onChange={(e) => setCustomer({ ...customer, mobile: e.target.value })}
            placeholder="Mobile Number"
            className="border border-slate-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-cyan-400"
          />

          <input
            value={customer.email}
            onChange={(e) => setCustomer({ ...customer, email: e.target.value })}
            placeholder="E-mail"
            className="border border-slate-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-cyan-400"
          />

          <input
            value={customer.gstin}
            onChange={(e) => setCustomer({ ...customer, gstin: e.target.value })}
            placeholder="GSTIN"
            className="border border-slate-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-cyan-400"
          />

          <input
            value={customer.placeOfSupply}
            onChange={(e) => setCustomer({ ...customer, placeOfSupply: e.target.value })}
            placeholder="Place of Supply"
            className="border border-slate-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-cyan-400"
          />
        </div>

        <div className="px-6 pb-6">
          <h3 className="text-lg font-bold mb-3">Selected Products</h3>

          <div className="border border-slate-200 rounded-xl overflow-hidden">
            {cart.map((item) => (
              <div
                key={item.id}
                className="px-4 py-3 border-b last:border-b-0 border-slate-100 flex justify-between gap-4"
              >
                <div>
                  <div className="font-semibold">{item.product_name}</div>
                  <div className="text-sm text-slate-500">
                    {item.company} � {item.product_code || "N/A"} � Qty: {item.quantity}
                  </div>
                </div>
                <div className="font-semibold">
                  Rs. {((item.price || 0) * item.quantity).toLocaleString("en-IN")}
                </div>
              </div>
            ))}
          </div>

          <button
            className="mt-6 w-full py-3 rounded-xl bg-cyan-500 text-white font-bold hover:bg-cyan-600 transition"
            onClick={() => alert("Quotation preview will be added next.")}
          >
            Generate Quotation ?
          </button>
        </div>
      </div>
    </div>
  );
}
export default function App() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [pdfResults, setPdfResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [cart, setCart] = useState([]);
  const [showQuotation, setShowQuotation] = useState(false);
  const [customer, setCustomer] = useState({ name: "", company: "", mobile: "", email: "", gstin: "", placeOfSupply: "" });

  const [stats, setStats] = useState({
    products: 0,
    companies: 3,
  });

  const debouncedQuery = useDebounced(query, 300);

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
      .catch(() => {});
  }, []);

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

        setResults(data && Array.isArray(data.products) ? data.products : []);
        setPdfResults(data && Array.isArray(data.pdfResults) ? data.pdfResults : []);
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

  function addToCart(product, change) {
    setCart((currentCart) => {
      const existing = currentCart.find(
        (item) => item.id === product.id
      );

      if (!existing && change > 0) {
        return [
          ...currentCart,
          {
            ...product,
            quantity: change,
          },
        ];
      }

      if (!existing) {
        return currentCart;
      }

      const newQuantity = existing.quantity + change;

      if (newQuantity <= 0) {
        return currentCart.filter(
          (item) => item.id !== product.id
        );
      }

      return currentCart.map((item) =>
        item.id === product.id
          ? { ...item, quantity: newQuantity }
          : item
      );
    });
  }

  function removeFromCart(id) {
    setCart((currentCart) =>
      currentCart.filter((item) => item.id !== id)
    );
  }

  const suggestions = [
    "Acetone",
    "Sodium Chloride",
    "SC0001",
    "Acetic Acid",
    "Ethanol",
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-white text-slate-900">
      <header className="border-b border-slate-200 bg-white/90 backdrop-blur">
        <div className="max-w-6xl mx-auto px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center text-xl font-bold">
              ?
            </div>

            <div className="text-xl font-extrabold tracking-tight">
              PriceCompare<span className="text-cyan-500">Lab</span>
            </div>
          </div>

          <div className="hidden sm:flex items-center gap-3 text-sm text-slate-500">
            <span>{stats.products.toLocaleString()} products</span>
            <span>|</span>
            <span>{stats.companies} companies</span>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-5">
        <section className="pt-14 pb-10 text-center">
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight">
            Compare{" "}
            <span className="text-cyan-500">
              Product Prices
            </span>
          </h1>

          <p className="mt-4 text-slate-500 max-w-2xl mx-auto">
            Search products by name, product code or CAS number
            and compare available company prices.
          </p>

          <div className="mt-8 max-w-3xl mx-auto">
            <div className="flex items-center bg-white rounded-2xl shadow-lg border border-slate-200 px-5 py-4 focus-within:ring-2 focus-within:ring-cyan-400">
              <span className="text-xl mr-3">#</span>

              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search by Product Code, Name or CAS Number"
                className="w-full outline-none text-base sm:text-lg bg-transparent placeholder:text-slate-400"
                autoFocus
              />

              {query && (
                <button
                  onClick={() => setQuery("")}
                  className="text-slate-400 hover:text-slate-700 px-2"
                >
                  ?
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

        <section className="pb-32">
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
                <ProductComparison
                  group={group}
                  onAddToCart={addToCart}
                  cart={cart}
                />
              </div>
            ))}

          <PdfResults pdfResults={pdfResults} />

          {!loading &&
            debouncedQuery.trim() &&
            groups.length === 0 &&
            !error && (
              <div className="text-center py-16">
                <div className="text-5xl mb-4">!</div>

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

      {cart.length > 0 && (
        <Cart
          cart={cart}
          onAddToCart={addToCart}
          onRemove={removeFromCart}
        />
      )}      
      {showQuotation && (
        <div className="fixed inset-0 z-[100] bg-slate-50 overflow-y-auto">
          <QuotationForm
            cart={cart}
            customer={customer}
            setCustomer={setCustomer}
            onBack={() => setShowQuotation(false)}
          />
        </div>
      )}    </div>
  );
}














