const fmt = (n) =>
  '₹' + n.toLocaleString('en-IN', { maximumFractionDigits: 2 });

export default function ResultCard({ group }) {
  const { name, variant, items, companies } = group;

  return (
    <div className="bg-white rounded-2xl shadow-card border border-navy-100 p-5 sm:p-6 hover:shadow-soft transition-shadow animate-fade-up">
      <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
        <div>
          <h3 className="font-display font-semibold text-navy-800 text-base sm:text-lg leading-snug">
            {name}
          </h3>
          <div className="mt-1 flex items-center gap-2 text-xs text-navy-400">
            <span className="px-2 py-0.5 rounded-full bg-navy-50 font-medium">{variant}</span>
            <span>
              {companies.length} {companies.length === 1 ? 'company' : 'companies'} available
            </span>
          </div>
        </div>
      </div>

      <div className={`grid gap-3 ${items.length >= 3 ? 'sm:grid-cols-3' : items.length === 2 ? 'sm:grid-cols-2' : 'sm:grid-cols-1'}`}>
        {items.map((it) => (
          <div
            key={it.id}
            className="rounded-xl px-4 py-4 border border-navy-100 bg-navy-50/40 flex flex-col gap-1.5"
          >
            <span className="font-display font-bold text-navy-700 text-sm tracking-wide uppercase">
              {it.company}
            </span>
            <span className="text-xs text-navy-400">Code: {it.code}</span>
            <span className="font-display font-bold text-navy-800 text-2xl mt-1">
              {fmt(it.price)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
