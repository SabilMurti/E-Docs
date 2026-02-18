import { useEffect, useRef, useState, createContext, useContext } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown, Check } from 'lucide-react';

const DropdownContext = createContext({});

function Dropdown({ 
  trigger, 
  children, 
  align = 'left',
  className = '' 
}) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  const triggerRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        dropdownRef.current && 
        !dropdownRef.current.contains(event.target) &&
        triggerRef.current &&
        !triggerRef.current.contains(event.target)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleItemClick = (callback) => {
    if (callback) callback();
    setIsOpen(false);
  };

  return (
    <div className={`relative inline-block ${className}`}>
      <div 
        ref={triggerRef}
        onClick={() => setIsOpen(!isOpen)}
      >
        {trigger}
      </div>

      {isOpen && (
        <div
          ref={dropdownRef}
          className={`
            absolute z-50 mt-1 min-w-[160px]
            bg-[var(--color-bg-elevated)] border border-[var(--color-border-primary)]
            rounded-lg shadow-lg overflow-hidden
            animate-in fade-in-0 zoom-in-95 duration-150
            ${align === 'right' ? 'right-0' : 'left-0'}
          `}
        >
          <div className="py-1">
            {Array.isArray(children)
              ? children.map((child, index) =>
                  child ? (
                    <DropdownContext.Provider
                      key={index}
                      value={{ handleItemClick }}
                    >
                      {child}
                    </DropdownContext.Provider>
                  ) : null
                )
              : children && (
                  <DropdownContext.Provider value={{ handleItemClick }}>
                    {children}
                  </DropdownContext.Provider>
                )}
          </div>
        </div>
      )}
    </div>
  );
}

// Context was here

function DropdownItem({ 
  children, 
  icon: Icon, 
  onClick, 
  danger = false,
  selected = false,
  disabled = false 
}) {
  const { handleItemClick } = useContext(DropdownContext);

  return (
    <button
      onClick={() => !disabled && handleItemClick(onClick)}
      disabled={disabled}
      className={`
        w-full flex items-center gap-2 px-3 py-1.5 text-sm text-left
        transition-colors
        ${disabled 
          ? 'opacity-50 cursor-not-allowed' 
          : danger 
            ? 'text-[var(--color-danger)] hover:bg-[var(--color-danger)]/10' 
            : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-hover)] hover:text-[var(--color-text-primary)]'
        }
        ${selected ? 'bg-[var(--color-accent)]/10 text-[var(--color-accent)]' : ''}
      `}
    >
      {Icon && <Icon size={14} className="shrink-0" />}
      <span className="flex-1 truncate">{children}</span>
      {selected && <Check size={14} className="shrink-0" />}
    </button>
  );
}

function DropdownDivider() {
  return <div className="my-1 h-px bg-[var(--color-border-primary)]" />;
}

Dropdown.Item = DropdownItem;
Dropdown.Divider = DropdownDivider;

export default Dropdown;
