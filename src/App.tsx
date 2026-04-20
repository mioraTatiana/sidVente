import { useEffect, useMemo, useState } from "react";

type Family = "Global" | "Electronique" | "Alimentaire" | "Textile";

type SummaryResponse = {
  months: number;
  family: Family;
  totalSales: number;
  averageStock: number;
  stockCoverageDays: number;
  lowStockEvents: number;
  salesTrendPct: number;
};

type MonthlyRow = {
  month: string;
  sales: number;
  stock: number;
  reorderPoint: number;
};

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(value);

export default function App() {
  const [period, setPeriod] = useState<"6" | "12">("6");
  const [family, setFamily] = useState<Family>("Global");
  const [summary, setSummary] = useState<SummaryResponse | null>(null);
  const [monthly, setMonthly] = useState<MonthlyRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const apiBaseUrl = useMemo(() => "http://localhost:4000", []);

  useEffect(() => {
    const controller = new AbortController();

    const run = async () => {
      setLoading(true);
      setError(null);
      try {
        const [summaryResponse, monthlyResponse] = await Promise.all([
          fetch(`${apiBaseUrl}/api/reports/summary?months=${period}&family=${family}`, { signal: controller.signal }),
          fetch(`${apiBaseUrl}/api/reports/monthly?months=${period}&family=${family}`, { signal: controller.signal }),
        ]);

        if (!summaryResponse.ok || !monthlyResponse.ok) {
          throw new Error("Impossible de recuperer les donnees. Verifie que le backend tourne.");
        }

        const summaryJson = (await summaryResponse.json()) as SummaryResponse;
        const monthlyJson = (await monthlyResponse.json()) as { data: MonthlyRow[] };
        setSummary(summaryJson);
        setMonthly(monthlyJson.data);
      } catch (fetchError) {
        if (fetchError instanceof Error && fetchError.name !== "AbortError") {
          setError(fetchError.message);
        }
      } finally {
        setLoading(false);
      }
    };

    run();
    return () => controller.abort();
  }, [apiBaseUrl, family, period]);

  const maxSales = monthly.length > 0 ? Math.max(...monthly.map((row) => row.sales)) : 1;

  const coverageSignal =
    summary && summary.stockCoverageDays < 20
      ? "text-rose-300"
      : summary && summary.stockCoverageDays < 35
        ? "text-amber-300"
        : "text-emerald-300";

  return (
    <main className="bg-slate-950 text-slate-100">

      <section id="dashboard" className="border-t border-slate-800 bg-slate-900/70">
        <div className="mx-auto max-w-6xl px-6 py-16 md:px-10">
          <h2 className="text-3xl font-semibold text-white">Dashboard debutant</h2>
          <p className="mt-3 max-w-3xl text-slate-300">Choisis une periode et une famille, puis lis les 3 indicateurs en dessous.</p>

          <div className="mt-8 grid gap-6 border border-slate-700/80 bg-slate-950/60 p-6 md:grid-cols-2">
            <label className="space-y-2 text-sm">
              <span className="font-medium text-slate-200">Periode</span>
              <select
                value={period}
                onChange={(event) => setPeriod(event.target.value as "6" | "12")}
                className="w-full border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100 outline-none focus:border-cyan-300"
              >
                <option value="6">6 derniers mois</option>
                <option value="12">12 derniers mois</option>
              </select>
            </label>

            <label className="space-y-2 text-sm">
              <span className="font-medium text-slate-200">Famille produit</span>
              <select
                value={family}
                onChange={(event) => setFamily(event.target.value as Family)}
                className="w-full border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100 outline-none focus:border-cyan-300"
              >
                <option value="Global">Global</option>
                <option value="Electronique">Electronique</option>
                <option value="Alimentaire">Alimentaire</option>
                <option value="Textile">Textile</option>
              </select>
            </label>
          </div>

          {loading ? <p className="animate-pulse-soft mt-8 text-sm text-slate-300">Chargement en cours...</p> : null}
          {error ? <p className="mt-8 text-sm text-rose-300">{error}</p> : null}

          {!loading && !error && summary ? (
            <div className="mt-10 grid gap-10 md:grid-cols-2">
              <div className="space-y-5 text-sm text-slate-200">
                <div>
                  <p className="text-slate-400">1. Ventes totales (CA)</p>
                  <p className="mt-1 text-3xl font-semibold text-white">{formatCurrency(summary.totalSales)}</p>
                  <p className="mt-1">Montant total vendu sur la periode choisie.</p>
                </div>

                <div>
                  <p className="text-slate-400">2. Stock moyen</p>
                  <p className="mt-1 text-3xl font-semibold text-white">{formatCurrency(summary.averageStock)}</p>
                  <p className="mt-1">Valeur moyenne du stock disponible.</p>
                </div>

                <div>
                  <p className="text-slate-400">3. Risque de rupture</p>
                  <p className={`mt-1 text-3xl font-semibold ${coverageSignal}`}>{summary.stockCoverageDays.toFixed(1)} jours de couverture</p>
                  <p className="mt-1">Plus ce nombre est bas, plus le risque de rupture est eleve. Alertes detectees: {summary.lowStockEvents}.</p>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-slate-100">Evolution des ventes par mois</h3>
                <p className="mt-2 text-sm text-slate-400">Barre longue = mois avec plus de ventes.</p>
                <div className="mt-5 space-y-3">
                  {monthly.map((row, index) => (
                    <div key={row.month} className="grid grid-cols-[42px_1fr_72px] items-center gap-3 text-xs">
                      <span className="text-slate-300">{row.month}</span>
                      <div className="h-2.5 w-full bg-slate-800">
                        <div
                          className="h-full origin-left animate-grow-bar bg-cyan-300"
                          style={{ width: `${(row.sales / maxSales) * 100}%`, animationDelay: `${index * 80}ms` }}
                        />
                      </div>
                      <span className="text-right text-slate-400">{Math.round(row.sales / 1000)}k</span>
                    </div>
                  ))}
                </div>
                <p className="mt-5 text-sm text-slate-300">
                  Tendance globale: {summary.salesTrendPct > 0 ? "+" : ""}
                  {summary.salesTrendPct.toFixed(1)}%.
                </p>
              </div>
            </div>
          ) : null}
        </div>
      </section>


    </main>
  );
}
