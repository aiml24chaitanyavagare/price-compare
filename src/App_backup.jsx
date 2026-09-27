import { useEffect, useMemo, useState } from "react";

const API_URL = "https://whats-characterized-narrative-wendy.trycloudflare.com";

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
                  Code: {product.product_code || "Ã¯Â¿Â½"}
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

function Cart({ cart, onAddToCart, onRemove, onContinueToQuotation }) {
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
                {item.company} Ã¯Â¿Â½ {item.product_code || "No code"}
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
            onClick={onContinueToQuotation}
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

function QuotationForm({ cart, customer, setCustomer, quotationNo, quotationDate, onBack, onGenerateQuotation }) {
  return (
    <div className="max-w-6xl mx-auto px-5 py-8">
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="px-6 py-5 bg-slate-900 text-white flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">Quotation</h2>
            <p className="text-sm text-slate-300 mt-1">Enter customer details</p>
          <div className="flex gap-4 text-sm text-slate-300 mt-2"><span>Quotation No.: <strong className="text-white">{quotationNo}</strong></span><span>Date: <strong className="text-white">{quotationDate}</strong></span></div>

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
                    {item.company} Ã¯Â¿Â½ {item.product_code || "N/A"} Ã¯Â¿Â½ Qty: {item.quantity}
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
            onClick={onGenerateQuotation}
          >
            Generate Quotation ?
          </button>
        </div>
      </div>
    </div>
  );
}
function QuotationPreview({ cart, customer, quotationNo, quotationDate, onBack }) {
  const subtotal = cart.reduce((sum, item) => {
    return sum + Number(item.quantity || 1) * Number(item.price || 0);
  }, 0);

  const totalGst = cart.reduce((sum, item) => {
    const qty = Number(item.quantity || 1);
    const price = Number(item.price || 0);
    const gst = Number(item.gst_percent || 0);
    return sum + ((qty * price * gst) / 100);
  }, 0);

  const grandTotal = subtotal + totalGst;

  const printQuotation = () => {
    const area = document.querySelector(".quotation-print-area");
    if (!area) return;

    const printWindow = window.open("", "_blank", "width=1000,height=1200");
    if (!printWindow) return;

    printWindow.document.write(`
      <html>
        <head>
          <title>Quotation - ${quotationNo}</title>
          <style>
            @page { size: A4; margin: 8mm; }
            * { box-sizing: border-box; }
            body {
              margin: 0;
              background: #ffffff;
              font-family: Arial, Helvetica, sans-serif;
              color: #172033;
              font-size: 10px;
            }
            .quotation-page {
              width: 100%;
              max-width: 194mm;
              margin: 0 auto;
              background: white;
            }
            .top-accent {
              height: 7px;
              background: linear-gradient(90deg, #0891b2, #2563eb, #7c3aed);
              border-radius: 4px 4px 0 0;
            }
            .header {
              display: flex;
              justify-content: space-between;
              align-items: flex-start;
              padding: 15px 16px 12px;
              border: 1px solid #d9e2ec;
              border-top: 0;
            }
            .brand {
              display: flex;
              align-items: center;
              gap: 10px;
            }
            .logo {
              width: 42px;
              height: 42px;
              border-radius: 10px;
              background: #0f172a;
              color: white;
              display: flex;
              align-items: center;
              justify-content: center;
              font-size: 20px;
              font-weight: 800;
            }
            .brand-name {
              font-size: 20px;
              font-weight: 800;
              color: #0f172a;
            }
            .tagline {
              margin-top: 2px;
              color: #64748b;
              font-size: 9px;
            }
            .quotation-title {
              text-align: right;
            }
            .quotation-title h1 {
              margin: 0;
              color: #0f172a;
              font-size: 24px;
              letter-spacing: 2px;
            }
            .quotation-meta {
              margin-top: 6px;
              line-height: 1.6;
              color: #475569;
            }
            .section-title {
              background: #f1f5f9;
              color: #0f172a;
              font-weight: 800;
              padding: 7px 9px;
              border-bottom: 1px solid #d9e2ec;
              text-transform: uppercase;
              letter-spacing: .5px;
              font-size: 9px;
            }
            .customer-box {
              margin-top: 12px;
              border: 1px solid #d9e2ec;
              border-radius: 7px;
              overflow: hidden;
            }
            .customer-grid {
              display: grid;
              grid-template-columns: 1fr 1fr;
            }
            .customer-cell {
              padding: 8px 10px;
              border-bottom: 1px solid #e2e8f0;
            }
            .customer-cell:nth-child(odd) {
              border-right: 1px solid #e2e8f0;
            }
            .label {
              color: #64748b;
              font-size: 8px;
              text-transform: uppercase;
              letter-spacing: .4px;
            }
            .value {
              margin-top: 2px;
              font-weight: 700;
              color: #172033;
            }
            .items-box {
              margin-top: 12px;
              border: 1px solid #cbd5e1;
              border-radius: 7px;
              overflow: hidden;
            }
            table {
              width: 100%;
              border-collapse: collapse;
            }
            th {
              background: #0f172a;
              color: white;
              padding: 7px 5px;
              font-size: 8px;
              text-align: center;
              border-right: 1px solid #334155;
            }
            td {
              padding: 7px 5px;
              border-right: 1px solid #d9e2ec;
              border-bottom: 1px solid #d9e2ec;
              vertical-align: middle;
            }
            tr:last-child td { border-bottom: 0; }
            th:last-child, td:last-child { border-right: 0; }
            .text-left { text-align: left; }
            .text-center { text-align: center; }
            .text-right { text-align: right; }
            .product-name {
              font-weight: 700;
              color: #172033;
            }
            .company-name {
              margin-top: 2px;
              font-size: 8px;
              color: #64748b;
            }
            .summary-row {
              display: flex;
              justify-content: flex-end;
              margin-top: 12px;
            }
            .summary {
              width: 72mm;
              border: 1px solid #cbd5e1;
              border-radius: 7px;
              overflow: hidden;
            }
            .summary-line {
              display: flex;
              justify-content: space-between;
              padding: 7px 10px;
              border-bottom: 1px solid #e2e8f0;
            }
            .summary-total {
              display: flex;
              justify-content: space-between;
              padding: 10px;
              background: #0f172a;
              color: white;
              font-size: 13px;
              font-weight: 800;
            }
            .terms {
              margin-top: 12px;
              border: 1px solid #d9e2ec;
              border-radius: 7px;
              overflow: hidden;
            }
            .terms-body {
              padding: 8px 10px;
              color: #475569;
              line-height: 1.55;
            }
            .footer {
              margin-top: 14px;
              padding-top: 9px;
              border-top: 1px solid #d9e2ec;
              display: flex;
              justify-content: space-between;
              color: #64748b;
              font-size: 8px;
            }
            .screen-only { display: none !important; }
          </style>
        </head>
        <body>
          ${area.innerHTML}
        </body>
      </html>
    `);

    printWindow.document.close();
    printWindow.focus();

    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 500);
  };

  return (
    <div className="quotation-print-area fixed inset-0 z-[120] bg-slate-100 overflow-y-auto p-4 md:p-8">
      <div className="quotation-page max-w-5xl mx-auto bg-white shadow-xl rounded-xl overflow-hidden p-5 md:p-7">

        <div className="top-accent h-2 rounded-t-lg bg-gradient-to-r from-cyan-500 via-blue-600 to-violet-600"></div>

        <div className="header flex justify-between items-start gap-5 border border-slate-200 border-t-0 p-5">
          <div className="brand flex items-center gap-3">
            <div className="logo w-11 h-11 rounded-xl bg-slate-900 text-white flex items-center justify-center text-xl font-extrabold">
              P
            </div>
            <div>
              <div className="brand-name text-2xl font-extrabold text-slate-900">PriceCompareLab</div>
              <div className="tagline text-sm text-slate-500">Professional Product Comparison &amp; Quotation</div>
            </div>
          </div>

          <div className="quotation-title text-right">
            <h1 className="text-3xl font-extrabold tracking-widest text-slate-900">QUOTATION</h1>
            <div className="quotation-meta text-sm text-slate-500 mt-2">
              <div><strong>Quotation No.:</strong> {quotationNo}</div>
              <div><strong>Date:</strong> {quotationDate}</div>
            </div>
          </div>
        </div>

        <div className="customer-box mt-4 border border-slate-200 rounded-xl overflow-hidden">
          <div className="section-title bg-slate-100 px-3 py-2 font-extrabold text-slate-800 text-xs">
            CUSTOMER DETAILS
          </div>

          <div className="customer-grid grid grid-cols-1 md:grid-cols-2">
            <div className="customer-cell p-3 border-b border-slate-200 md:border-r">
              <div className="label text-xs text-slate-500">Customer Name</div>
              <div className="value font-bold">{customer.name || "-"}</div>
            </div>

            <div className="customer-cell p-3 border-b border-slate-200">
              <div className="label text-xs text-slate-500">Company</div>
              <div className="value font-bold">{customer.company || "-"}</div>
            </div>

            <div className="customer-cell p-3 border-b border-slate-200 md:border-r">
              <div className="label text-xs text-slate-500">Mobile</div>
              <div className="value font-bold">{customer.mobile || "-"}</div>
            </div>

            <div className="customer-cell p-3 border-b border-slate-200">
              <div className="label text-xs text-slate-500">E-mail</div>
              <div className="value font-bold">{customer.email || "-"}</div>
            </div>

            <div className="customer-cell p-3 md:border-r">
              <div className="label text-xs text-slate-500">GSTIN</div>
              <div className="value font-bold">{customer.gstin || "-"}</div>
            </div>

            <div className="customer-cell p-3">
              <div className="label text-xs text-slate-500">Place of Supply</div>
              <div className="value font-bold">{customer.placeOfSupply || customer.place || "-"}</div>
            </div>
          </div>
        </div>

        <div className="items-box mt-4 border border-slate-300 rounded-xl overflow-hidden">
          <div className="section-title bg-slate-100 px-3 py-2 font-extrabold text-slate-800 text-xs">
            PRODUCT DETAILS
          </div>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-xs">
              <thead>
                <tr className="bg-slate-900 text-white">
                  <th className="border p-2">Sr.</th>
                  <th className="border p-2 text-left">Product Description</th>
                  <th className="border p-2">Company</th>
                  <th className="border p-2">CAS No.</th>
                  <th className="border p-2">Code</th>
                  <th className="border p-2">Qty</th>
                  <th className="border p-2 text-right">Unit Price</th>
                  <th className="border p-2 text-right">Total</th>
                </tr>
              </thead>

              <tbody>
                {cart.map((item, index) => {
                  const qty = Number(item.quantity || 1);
                  const price = Number(item.price || 0);

                  return (
                    <tr key={item.id || index}>
                      <td className="border p-2 text-center">{index + 1}</td>
                      <td className="border p-2">
                        <div className="product-name font-bold">
                          {item.product_name || item.name || "-"}
                        </div>
                        {item.packing && (
                          <div className="company-name text-slate-500">
                            Packing: {item.packing}
                          </div>
                        )}
                      </td>
                      <td className="border p-2 text-center">{item.company || "-"}</td>
                      <td className="border p-2 text-center">{item.cas_number || item.cas || "-"}</td>
                      <td className="border p-2 text-center">{item.product_code || item.code || "-"}</td>
                      <td className="border p-2 text-center">{qty}</td>
                      <td className="border p-2 text-right">Rs. {price.toLocaleString("en-IN")}</td>
                      <td className="border p-2 text-right font-bold">
                        Rs. {(qty * price).toLocaleString("en-IN")}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        <div className="summary-row flex justify-end mt-4">
          <div className="summary w-full md:w-80 border border-slate-300 rounded-xl overflow-hidden">
            <div className="summary-line flex justify-between p-3 border-b">
              <span>Subtotal</span>
              <strong>Rs. {subtotal.toLocaleString("en-IN")}</strong>
            </div>

            <div className="summary-line flex justify-between p-3 border-b">
              <span>GST</span>
              <strong>Rs. {totalGst.toLocaleString("en-IN")}</strong>
            </div>

            <div className="summary-total flex justify-between p-3 bg-slate-900 text-white">
              <span>GRAND TOTAL</span>
              <span>Rs. {grandTotal.toLocaleString("en-IN")}</span>
            </div>
          </div>
        </div>

        <div className="terms mt-4 border border-slate-200 rounded-xl overflow-hidden">
          <div className="section-title bg-slate-100 px-3 py-2 font-extrabold text-slate-800 text-xs">
            TERMS &amp; CONDITIONS
          </div>
          <div className="terms-body p-3 text-sm text-slate-600 leading-relaxed">
            <div>1. Quotation validity and stock availability are subject to confirmation.</div>
            <div>2. Transportation / courier charges may be extra.</div>
            <div>3. Products are intended for research and development use only.</div>
            <div>4. Prices and applicable taxes are subject to confirmation at the time of order.</div>
          </div>
        </div>

        <div className="footer mt-4 pt-3 border-t border-slate-200 flex justify-between text-xs text-slate-500">
          <span>Thank you for your business.</span>
          <span>PriceCompareLab | Professional Quotation</span>
        </div>

        <div className="screen-only flex gap-3 mt-6">
          <button
            className="px-5 py-3 rounded-xl bg-slate-700 text-white font-bold"
            onClick={onBack}
          >
            Back
          </button>

          <button
            className="px-5 py-3 rounded-xl bg-cyan-500 text-white font-bold"
            onClick={printQuotation}
          >
            Print / Save PDF
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
  const [showQuotationPreview, setShowQuotationPreview] = useState(false);
  const saveQuotation = async () => {
    try {
      const response = await fetch(`${API_URL}/api/quotations`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          quotationNo,
          quotationDate,
          customer: {
            ...customer,
            place: customer.placeOfSupply || customer.place || "",
          },
          items: cart.map((item) => ({
            product_id: item.id,
            product_name: item.product_name || item.name || "-",
            company: item.company || "",
            product_code: item.product_code || item.code || "",
            cas_number: item.cas_number || item.cas || "",
            hsn_code: item.hsn_code || "",
            packing: item.packing || "",
            quantity: Number(item.quantity || 1),
            unit_price: Number(item.price || 0),
            discount_percent: Number(item.discount_percent || 0),
            gst_percent: Number(item.gst_percent || 0),
          })),
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Quotation save failed");
      }

      console.log("Quotation saved:", data);
      setShowQuotationPreview(true);
    } catch (error) {
      console.error("Quotation save error:", error);
      alert("Quotation save failed. Please try again.");
    }
  };
  const [customer, setCustomer] = useState({ name: "", company: "", mobile: "", email: "", gstin: "", placeOfSupply: "" });
  const [quotationNo, setQuotationNo] = useState("");
  const [quotationDate, setQuotationDate] = useState("");
  const generateQuotationMeta = () => {
    const now = new Date();
    const date = now.toISOString().slice(0, 10);
    setQuotationNo("QT-" + now.getFullYear() + "-" + String(now.getTime()).slice(-6));
    setQuotationDate(date);
  };

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
          onContinueToQuotation={() => { generateQuotationMeta(); setShowQuotation(true); }}
        />
      )}      
      {showQuotationPreview && (
        <QuotationPreview
          cart={cart}
          customer={customer}
          quotationNo={quotationNo}
          quotationDate={quotationDate}
          onBack={() => setShowQuotationPreview(false)}
        />
      )}
      {showQuotation && (
        <div className="fixed inset-0 z-[100] bg-slate-50 overflow-y-auto">
          <QuotationForm
            cart={cart}
            customer={customer}
            setCustomer={setCustomer}
            quotationNo={quotationNo}
            quotationDate={quotationDate}
            onGenerateQuotation={saveQuotation}
            onBack={() => setShowQuotation(false)}
          />
        </div>
      )}    </div>
  );
}






















