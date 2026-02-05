import { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';

function Dropdown({ 
  trigger, 
  children, 
  align = 'right',
  className = ''
}) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const alignments = {
    left: 'left-0',
    right: 'right-0',
  };

  return (
    <div ref={dropdownRef} className={`relative ${className}`}>
      <div onClick={() => setIsOpen(!isOpen)} className="cursor-pointer">
        {trigger}
      </div>
      
      {isOpen && (
        <div 
          className={`
            absolute top-full mt-2 ${alignments[align]}
            min-w-[180px] py-1
            bg-[var(--color-bg-primary)]
            border border-[var(--color-border)]
            rounded-lg shadow-lg
            z-50 animate-slideIn
          `}
        >
          {children}
        </div>
      )}
    </div>
  );
}

function DropdownItem({ 
  children, 
  onClick, 
  icon: Icon,
  danger = false,
  className = ''
}) {
  return (
    <button
      onClick={onClick}
      className={`
        w-full flex items-center gap-2 px-3 py-2
        text-sm text-left
        transition-colors duration-150
        ${danger 
          ? 'text-[var(--color-error)] hover:bg-red-50 dark:hover:bg-red-950' 
          : 'text-[var(--color-text-primary)] hover:bg-[var(--color-bg-secondary)]'
        }
        ${className}
      `}
    >
      {Icon && <Icon size={16} />}
      {children}
    </button>
  );
}

function DropdownDivider() {
  return <div className="my-1 border-t border-[var(--color-border)]" />;
}

Dropdown.Item = DropdownItem;
Dropdown.Divider = DropdownDivider;

export default Dropdown;
