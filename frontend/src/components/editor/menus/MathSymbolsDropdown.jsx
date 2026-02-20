import { useState, useCallback, useMemo } from 'react';
import { ChevronDown, X } from 'lucide-react';

/**
 * MathSymbolsDropdown - Comprehensive math symbol picker
 * Inspired by Pormulir's rich editor
 */
export default function MathSymbolsDropdown({ editor }) {
  const [isOpen, setIsOpen] = useState(false);

  const MATH_CATEGORIES = useMemo(() => [
    {
      label: 'Operators',
      symbols: [
        { symbol: '±', name: 'Plus-minus' }, { symbol: '×', name: 'Multiply' },
        { symbol: '÷', name: 'Divide' }, { symbol: '·', name: 'Dot' },
        { symbol: '√', name: 'Square root' }, { symbol: '∛', name: 'Cube root' },
        { symbol: '∑', name: 'Sum' }, { symbol: '∏', name: 'Product' },
        { symbol: '∫', name: 'Integral' },
      ],
    },
    {
      label: 'Comparison',
      symbols: [
        { symbol: '≠', name: 'Not equal' }, { symbol: '≈', name: 'Approximately' },
        { symbol: '≤', name: 'Less or equal' }, { symbol: '≥', name: 'Greater or equal' },
        { symbol: '≪', name: 'Much less' }, { symbol: '≫', name: 'Much greater' },
        { symbol: '∝', name: 'Proportional' }, { symbol: '≡', name: 'Identical' },
      ],
    },
    {
      label: 'Greek Letters',
      symbols: [
        { symbol: 'α', name: 'Alpha' }, { symbol: 'β', name: 'Beta' },
        { symbol: 'γ', name: 'Gamma' }, { symbol: 'δ', name: 'Delta' },
        { symbol: 'θ', name: 'Theta' }, { symbol: 'λ', name: 'Lambda' },
        { symbol: 'π', name: 'Pi' }, { symbol: 'σ', name: 'Sigma' },
        { symbol: 'φ', name: 'Phi' }, { symbol: 'ω', name: 'Omega' },
        { symbol: 'Δ', name: 'Delta (cap)' }, { symbol: 'Σ', name: 'Sigma (cap)' },
      ],
    },
    {
      label: 'Set & Logic',
      symbols: [
        { symbol: '∈', name: 'Element of' }, { symbol: '∉', name: 'Not element' },
        { symbol: '⊂', name: 'Subset' }, { symbol: '⊃', name: 'Superset' },
        { symbol: '∪', name: 'Union' }, { symbol: '∩', name: 'Intersection' },
        { symbol: '∅', name: 'Empty set' }, { symbol: '∀', name: 'For all' },
        { symbol: '∃', name: 'Exists' }, { symbol: '∧', name: 'And' },
        { symbol: '∨', name: 'Or' }, { symbol: '¬', name: 'Not' },
      ],
    },
    {
      label: 'Constants & Misc',
      symbols: [
        { symbol: '∞', name: 'Infinity' }, { symbol: '°', name: 'Degree' },
        { symbol: '′', name: 'Prime' }, { symbol: '″', name: 'Double prime' },
        { symbol: '∂', name: 'Partial' }, { symbol: '∇', name: 'Nabla' },
        { symbol: '‰', name: 'Per mille' }, { symbol: '→', name: 'Arrow right' },
        { symbol: '←', name: 'Arrow left' }, { symbol: '↔', name: 'Arrow both' },
        { symbol: '⇒', name: 'Implies' }, { symbol: '⇔', name: 'If and only if' },
      ],
    },
    {
      label: 'Fractions',
      symbols: [
        { symbol: '½', name: 'One half' }, { symbol: '⅓', name: 'One third' },
        { symbol: '⅔', name: 'Two thirds' }, { symbol: '¼', name: 'One quarter' },
        { symbol: '¾', name: 'Three quarters' }, { symbol: '⅕', name: 'One fifth' },
        { symbol: '⅙', name: 'One sixth' }, { symbol: '⅛', name: 'One eighth' },
      ],
    },
  ], []);

  const insertSymbol = useCallback((symbol) => {
    if (editor) {
      editor.chain().focus().insertContent(symbol).run();
    }
    setIsOpen(false);
  }, [editor]);

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`p-1.5 rounded-lg transition-colors flex items-center gap-0.5 ${
          isOpen 
            ? 'bg-[var(--color-accent)]/10 text-[var(--color-accent)]' 
            : 'text-[var(--color-text-muted)] hover:bg-[var(--color-bg-hover)] hover:text-[var(--color-text-primary)]'
        }`}
        title="Math Symbols"
        type="button"
      >
        <span className="text-sm font-medium">∑</span>
        <ChevronDown className="w-3 h-3" />
      </button>
      
      {isOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setIsOpen(false)}
          />
          
          {/* Dropdown Panel */}
          <div className="absolute left-0 top-full mt-1 bg-[var(--color-bg-elevated)] rounded-lg shadow-xl border border-[var(--color-border-primary)] z-50 p-2 w-80 max-h-96 overflow-y-auto">
            <div className="flex items-center justify-between mb-2 px-1">
              <span className="text-xs font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider">
                Math Symbols
              </span>
              <button
                onClick={() => setIsOpen(false)}
                className="p-0.5 rounded hover:bg-[var(--color-bg-hover)] text-[var(--color-text-muted)]"
              >
                <X size={12} />
              </button>
            </div>
            
            {MATH_CATEGORIES.map((category, catIndex) => (
              <div key={catIndex} className="mb-3 last:mb-0">
                <div className="text-[10px] font-medium text-[var(--color-text-muted)] uppercase tracking-wider px-1 mb-1.5">
                  {category.label}
                </div>
                <div className="flex flex-wrap gap-0.5">
                  {category.symbols.map((item, symIndex) => (
                    <button
                      key={symIndex}
                      onClick={() => insertSymbol(item.symbol)}
                      className="w-7 h-7 flex items-center justify-center text-lg hover:bg-[var(--color-accent)]/10 hover:text-[var(--color-accent)] rounded transition-colors"
                      title={item.name}
                      type="button"
                    >
                      {item.symbol}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
