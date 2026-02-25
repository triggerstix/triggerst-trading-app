import { useState } from "react";
import { Link } from "wouter";
import { ArrowLeft, Pencil, Minus, TrendingUp, MousePointer2, Trash2, X, ChevronDown, ChevronRight } from "lucide-react";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(true);
  return (
    <div className="mb-10">
      <button
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-2 w-full text-left mb-4 pb-2 border-b border-slate-700 group"
      >
        {open ? <ChevronDown className="w-4 h-4 text-slate-400" /> : <ChevronRight className="w-4 h-4 text-slate-400" />}
        <span className="text-lg font-semibold text-slate-100 group-hover:text-cyan-400 transition-colors">{title}</span>
      </button>
      {open && <div>{children}</div>}
    </div>
  );
}

function ToolCard({
  icon,
  title,
  description,
  steps,
  tip,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  steps: string[];
  tip: string;
}) {
  return (
    <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 mb-4">
      <div className="flex items-center gap-3 mb-2">
        <span className="p-2 rounded-lg bg-slate-700 text-cyan-400">{icon}</span>
        <h3 className="text-sm font-semibold text-cyan-400 uppercase tracking-wide">{title}</h3>
      </div>
      <p className="text-slate-400 text-sm mb-4">{description}</p>
      <ol className="space-y-2 mb-4">
        {steps.map((s, i) => (
          <li key={i} className="flex items-start gap-3 text-sm text-slate-200">
            <span className="flex-shrink-0 w-5 h-5 rounded-full bg-cyan-500 text-slate-900 text-xs font-bold flex items-center justify-center mt-0.5">
              {i + 1}
            </span>
            <span dangerouslySetInnerHTML={{ __html: s }} />
          </li>
        ))}
      </ol>
      <div className="bg-slate-900 border-l-2 border-cyan-500 rounded-r-lg px-3 py-2 text-xs text-sky-300">
        {tip}
      </div>
    </div>
  );
}

function Kbd({ children }: { children: React.ReactNode }) {
  return (
    <kbd className="bg-slate-700 border border-slate-500 border-b-2 rounded px-1.5 py-0.5 font-mono text-xs text-slate-200">
      {children}
    </kbd>
  );
}

export default function HelpPage() {
  return (
    <div className="min-h-screen bg-slate-900 text-slate-100">
      {/* Header */}
      <div className="border-b border-slate-700 bg-slate-900/95 sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-6 py-4 flex items-center gap-4">
          <Link href="/" className="text-slate-400 hover:text-slate-200 transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-lg font-bold text-cyan-400">Drawing Tools Manual</h1>
            <p className="text-xs text-slate-500">Chart Drawing Layer · v1.0</p>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-6 py-10">

        {/* TOOLBAR OVERVIEW */}
        <Section title="Toolbar Overview">
          <p className="text-slate-400 text-sm mb-5">
            The drawing toolbar runs vertically on the <strong className="text-slate-200">left side</strong> of the chart.
            The active mode is highlighted in blue or cyan.
          </p>
          <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 space-y-5">
            {/* Navigation group */}
            <div>
              <p className="text-xs text-slate-500 uppercase tracking-widest mb-3">Navigation</p>
              <div className="flex items-center gap-4">
                <div className="w-9 h-9 rounded-lg bg-blue-600 border border-blue-500 flex items-center justify-center flex-shrink-0">
                  <MousePointer2 className="w-4 h-4 text-white" />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-200">Select / Pan</p>
                  <p className="text-xs text-slate-500">Default mode — drag to scroll the chart, click a drawing to select it</p>
                </div>
              </div>
            </div>
            {/* Drawing tools group */}
            <div>
              <p className="text-xs text-slate-500 uppercase tracking-widest mb-3">Drawing Tools</p>
              <div className="space-y-3">
                {[
                  { icon: <Pencil className="w-4 h-4" />, label: "Trendline", desc: "Two-click: anchor → anchor → commit" },
                  { icon: <Minus className="w-4 h-4" />, label: "Horizontal Line", desc: "Single click places a full-width price level" },
                  { icon: <TrendingUp className="w-4 h-4" />, label: "Fibonacci Retracement", desc: "Two-click: swing high → swing low (or vice versa)" },
                ].map(({ icon, label, desc }) => (
                  <div key={label} className="flex items-center gap-4">
                    <div className="w-9 h-9 rounded-lg bg-slate-700 border border-slate-600 flex items-center justify-center flex-shrink-0 text-slate-400">
                      {icon}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-200">{label}</p>
                      <p className="text-xs text-slate-500">{desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            {/* Indicators group */}
            <div>
              <p className="text-xs text-slate-500 uppercase tracking-widest mb-3">Indicators</p>
              <div className="flex flex-wrap gap-3">
                {["Volume", "RSI (14)", "MACD (12,26,9)", "SMA 20"].map(name => (
                  <span key={name} className="bg-slate-700 border border-slate-600 rounded-lg px-3 py-1.5 text-xs text-slate-300 font-medium">
                    {name}
                  </span>
                ))}
              </div>
            </div>
            {/* Management group */}
            <div>
              <p className="text-xs text-slate-500 uppercase tracking-widest mb-3">Drawing Management</p>
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-slate-700 border border-slate-600 flex items-center justify-center text-slate-400">
                    <Trash2 className="w-4 h-4" />
                  </div>
                  <span className="text-sm text-slate-300">Delete Selected</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-slate-700 border border-slate-600 flex items-center justify-center text-slate-400">
                    <X className="w-4 h-4" />
                  </div>
                  <span className="text-sm text-slate-300">Clear All</span>
                </div>
              </div>
            </div>
          </div>
        </Section>

        {/* STATE FLOW */}
        <Section title="Drawing State Flow">
          <div className="flex items-center flex-wrap gap-2 mb-4">
            {[
              { label: "① Idle (Select/Pan)", cls: "border-slate-600 text-slate-300" },
              { label: "→", cls: "border-transparent text-slate-500 px-0 bg-transparent" },
              { label: "② Tool Active", cls: "border-cyan-600 text-cyan-400" },
              { label: "→", cls: "border-transparent text-slate-500 px-0 bg-transparent" },
              { label: "③ 1st click — Ghost preview", cls: "border-slate-500 text-slate-400" },
              { label: "→", cls: "border-transparent text-slate-500 px-0 bg-transparent" },
              { label: "④ 2nd click — Committed", cls: "border-yellow-500 text-yellow-400" },
            ].map(({ label, cls }) => (
              <span key={label} className={`inline-flex items-center border rounded-full px-3 py-1 text-xs font-semibold bg-slate-800 ${cls}`}>
                {label}
              </span>
            ))}
          </div>
          <p className="text-slate-400 text-sm">
            Horizontal line skips step ③ — it commits on the first click. Press{" "}
            <Kbd>Esc</Kbd> or click the <strong className="text-slate-200">Cancel</strong> overlay to return to ① from any stage.
          </p>
        </Section>

        {/* TOOL DETAILS */}
        <Section title="Tool Details">
          <ToolCard
            icon={<Pencil className="w-4 h-4" />}
            title="Trendline"
            description="Draw a diagonal line between any two price-time points. Color: cyan. Used for support/resistance slopes, channels, and angle analysis."
            steps={[
              "Click the <strong>Pencil</strong> button — toolbar highlights cyan, crosshair cursor appears on the chart.",
              "Click your <strong>first anchor point</strong>. A ghost line now trails your cursor in real time.",
              "Move to your <strong>second anchor</strong> — price labels preview both endpoints live.",
              "Click to <strong>commit</strong>. The line turns solid cyan and saves automatically.",
            ]}
            tip="💡 To draw another trendline, click the Pencil button again — it toggles back on after each commit."
          />
          <ToolCard
            icon={<Minus className="w-4 h-4" />}
            title="Horizontal Line"
            description="Places a full-width price level line with a single click. Color: cyan. Ideal for support, resistance, pivot levels, and price targets."
            steps={[
              "Click the <strong>Minus (—)</strong> button in the toolbar.",
              "Click anywhere on the chart. The line <strong>commits instantly</strong> at that price — no second click needed.",
              "In Select/Pan mode, click the line to <strong>select it</strong> (turns gold). Press Delete to remove.",
            ]}
            tip="💡 Click the tool again after each line to place another level."
          />
          <ToolCard
            icon={<TrendingUp className="w-4 h-4" />}
            title="Fibonacci Retracement"
            description="Anchors six horizontal retracement levels between two price points. Levels: 0%, 23.6%, 38.2%, 50%, 61.8%, 100% in graduated purple shades."
            steps={[
              "Click the <strong>Fibonacci</strong> button in the toolbar.",
              "Click your <strong>swing high</strong> (or low) as the first anchor.",
              "Click the <strong>swing low</strong> (or high) — all six levels appear instantly.",
              "Levels render as labeled horizontal lines spanning the full chart width.",
            ]}
            tip="💡 Direction doesn't matter — anchor either end first. Levels auto-calculate between the two prices."
          />
        </Section>

        {/* GHOST LINE */}
        <Section title="Drafting Cursor & Ghost Line">
          <p className="text-slate-400 text-sm mb-4">
            When any drawing tool is active, the standard crosshair is replaced by a full-canvas{" "}
            <strong className="text-slate-200">drafting cursor</strong> synchronized to the chart coordinate system.
            After the first anchor click, a{" "}
            <strong className="text-slate-200">ghost line</strong> appears in light gray — a live preview of your
            drawing as you move the cursor.
          </p>
          <div className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden">
            <svg viewBox="0 0 540 140" xmlns="http://www.w3.org/2000/svg" className="w-full">
              <rect width="540" height="140" fill="#0a1628"/>
              <line x1="0" y1="35" x2="540" y2="35" stroke="#1e293b" strokeWidth="1"/>
              <line x1="0" y1="70" x2="540" y2="70" stroke="#1e293b" strokeWidth="1"/>
              <line x1="0" y1="105" x2="540" y2="105" stroke="#1e293b" strokeWidth="1"/>
              <line x1="90" y1="0" x2="90" y2="140" stroke="#1e293b" strokeWidth="1"/>
              <line x1="180" y1="0" x2="180" y2="140" stroke="#1e293b" strokeWidth="1"/>
              <line x1="270" y1="0" x2="270" y2="140" stroke="#1e293b" strokeWidth="1"/>
              <line x1="360" y1="0" x2="360" y2="140" stroke="#1e293b" strokeWidth="1"/>
              <line x1="450" y1="0" x2="450" y2="140" stroke="#1e293b" strokeWidth="1"/>
              <rect x="20" y="82" width="10" height="26" fill="#10b981" rx="1"/>
              <rect x="40" y="74" width="10" height="30" fill="#10b981" rx="1"/>
              <rect x="60" y="68" width="10" height="26" fill="#ef4444" rx="1"/>
              <rect x="80" y="59" width="10" height="24" fill="#10b981" rx="1"/>
              <rect x="100" y="50" width="10" height="26" fill="#10b981" rx="1"/>
              <rect x="120" y="45" width="10" height="24" fill="#10b981" rx="1"/>
              <rect x="140" y="39" width="10" height="26" fill="#10b981" rx="1"/>
              <rect x="160" y="44" width="10" height="28" fill="#ef4444" rx="1"/>
              <rect x="180" y="35" width="10" height="24" fill="#10b981" rx="1"/>
              <rect x="200" y="38" width="10" height="26" fill="#10b981" rx="1"/>
              <rect x="220" y="33" width="10" height="24" fill="#10b981" rx="1"/>
              <rect x="240" y="37" width="10" height="24" fill="#ef4444" rx="1"/>
              <rect x="260" y="42" width="10" height="26" fill="#10b981" rx="1"/>
              <rect x="280" y="48" width="10" height="24" fill="#ef4444" rx="1"/>
              <rect x="300" y="45" width="10" height="26" fill="#10b981" rx="1"/>
              <rect x="320" y="52" width="10" height="24" fill="#10b981" rx="1"/>
              <rect x="340" y="57" width="10" height="28" fill="#ef4444" rx="1"/>
              <circle cx="145" cy="44" r="5" fill="#06b6d4"/>
              <line x1="145" y1="44" x2="390" y2="62" stroke="#94a3b8" strokeWidth="1.5" strokeDasharray="6 3"/>
              <rect x="152" y="32" width="44" height="13" fill="#1e293b" rx="3"/>
              <text x="155" y="42" fontFamily="monospace" fontSize="9" fill="#94a3b8">$438.50</text>
              <rect x="350" y="50" width="44" height="13" fill="#1e293b" rx="3"/>
              <text x="353" y="60" fontFamily="monospace" fontSize="9" fill="#94a3b8">$432.10</text>
              <line x1="390" y1="0" x2="390" y2="140" stroke="#94a3b8" strokeWidth="1" opacity="0.4"/>
              <line x1="0" y1="62" x2="540" y2="62" stroke="#94a3b8" strokeWidth="1" opacity="0.4"/>
              <circle cx="390" cy="62" r="4" fill="#94a3b8" opacity="0.8"/>
              <text x="108" y="34" fontFamily="sans-serif" fontSize="9" fill="#06b6d4">1st anchor ●</text>
              <text x="396" y="78" fontFamily="sans-serif" fontSize="9" fill="#94a3b8">cursor</text>
              <text x="160" y="130" fontFamily="sans-serif" fontSize="10" fill="#94a3b8">Ghost preview (gray dashed) — commit with 2nd click</text>
            </svg>
          </div>
        </Section>

        {/* SELECT & DELETE */}
        <Section title="Selecting & Deleting Drawings">
          <p className="text-slate-400 text-sm mb-4">
            In <strong className="text-slate-200">Select/Pan mode</strong>, click any drawing to select it.
            Selected drawings turn <strong className="text-yellow-400">gold</strong>.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-slate-800 border border-slate-700 rounded-xl p-5">
              <h3 className="text-xs font-semibold text-cyan-400 uppercase tracking-wide mb-3">🗑 Delete Selected</h3>
              <ul className="space-y-2 text-sm text-slate-400">
                <li>→ Press <Kbd>Delete</Kbd> or <Kbd>Backspace</Kbd></li>
                <li>→ Or click the <strong className="text-slate-200">Trash icon</strong> in the toolbar</li>
              </ul>
            </div>
            <div className="bg-slate-800 border border-slate-700 rounded-xl p-5">
              <h3 className="text-xs font-semibold text-cyan-400 uppercase tracking-wide mb-3">✕ Clear All</h3>
              <ul className="space-y-2 text-sm text-slate-400">
                <li>→ Click the <strong className="text-slate-200">X icon</strong> in the toolbar</li>
                <li>→ Removes every drawing for that symbol</li>
                <li className="text-red-400">⚠ Cannot be undone</li>
              </ul>
            </div>
          </div>
        </Section>

        {/* PERSISTENCE */}
        <Section title="Persistence">
          <p className="text-slate-400 text-sm">
            All drawings <strong className="text-slate-200">auto-save per symbol</strong> via the server.
            They reload automatically the next time you open the same chart — no manual save needed.
            Drawings are tied to your account and symbol; AAPL trendlines only appear on AAPL charts.
          </p>
        </Section>

        {/* KEYBOARD SHORTCUTS */}
        <Section title="Keyboard Shortcuts">
          <div className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-700">
                  <th className="text-left px-5 py-3 text-xs text-slate-500 uppercase tracking-wider font-semibold">Key</th>
                  <th className="text-left px-5 py-3 text-xs text-slate-500 uppercase tracking-wider font-semibold">Action</th>
                  <th className="text-left px-5 py-3 text-xs text-slate-500 uppercase tracking-wider font-semibold">When</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-slate-700/50">
                  <td className="px-5 py-3"><Kbd>Esc</Kbd></td>
                  <td className="px-5 py-3 text-slate-200">Cancel drawing, return to Select/Pan</td>
                  <td className="px-5 py-3 text-slate-500">Any active drawing mode</td>
                </tr>
                <tr>
                  <td className="px-5 py-3"><Kbd>Delete</Kbd> / <Kbd>Backspace</Kbd></td>
                  <td className="px-5 py-3 text-slate-200">Delete the selected drawing</td>
                  <td className="px-5 py-3 text-slate-500">Select/Pan mode, drawing selected</td>
                </tr>
              </tbody>
            </table>
          </div>
        </Section>

        {/* LIMITATIONS */}
        <Section title="Current Limitations (Planned)">
          <ul className="space-y-2 text-sm text-slate-400">
            {[
              "Color picker per drawing",
              "Line style options (dash, dot, weight)",
              "Arrow / directional annotation tool",
              "Ray / angle fan tool",
              "Text label annotations",
              "Undo / redo",
              "Chart export (PNG/PDF)",
            ].map(item => (
              <li key={item} className="flex items-center gap-2">
                <span className="w-4 h-4 rounded border border-slate-600 flex-shrink-0" />
                {item}
              </li>
            ))}
          </ul>
        </Section>

        <div className="border-t border-slate-700 pt-6 text-xs text-slate-600">
          Triggerstix Trading App · Drawing Tools Manual · v1.0 · Feb 2026
        </div>
      </div>
    </div>
  );
}
