"use client";

import { useState, useRef, useEffect, ReactNode } from "react";

interface DropdownMenuProps {
  trigger: ReactNode;
  children: ReactNode;
  align?: "left" | "right";
}

export function DropdownMenu({ trigger, children, align = "right" }: DropdownMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleEscape);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen]);

  return (
    <div className="dropdown-container" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="dropdown-trigger"
        aria-haspopup="true"
        aria-expanded={isOpen}
      >
        {trigger}
      </button>

      {isOpen && (
        <div className={`dropdown-menu dropdown-menu-${align}`} role="menu">
          {children}
        </div>
      )}

      <style jsx>{`
        .dropdown-container {
          position: relative;
          display: inline-block;
        }

        .dropdown-trigger {
          background: none;
          border: none;
          cursor: pointer;
          padding: 6px;
          border-radius: 4px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--muted);
          transition: all 0.15s;
        }

        .dropdown-trigger:hover {
          background: #f3f4f6;
          color: var(--text);
        }

        .dropdown-trigger:focus-visible {
          outline: 2px solid var(--info);
          outline-offset: 2px;
        }

        .dropdown-menu {
          position: absolute;
          top: calc(100% + 4px);
          z-index: 100;
          min-width: 180px;
          background: #ffffff;
          border: 1px solid var(--border);
          border-radius: 8px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
          padding: 4px;
          animation: dropdownFadeIn 0.15s ease;
        }

        .dropdown-menu-right {
          right: 0;
        }

        .dropdown-menu-left {
          left: 0;
        }

        @keyframes dropdownFadeIn {
          from {
            opacity: 0;
            transform: translateY(-8px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}

interface DropdownItemProps {
  children: ReactNode;
  onClick?: () => void;
  icon?: ReactNode;
  danger?: boolean;
  disabled?: boolean;
}

export function DropdownItem({ children, onClick, icon, danger, disabled }: DropdownItemProps) {
  return (
    <>
      <button
        className={`dropdown-item ${danger ? "danger" : ""}`}
        onClick={onClick}
        disabled={disabled}
        role="menuitem"
        type="button"
      >
        {icon && <span className="dropdown-item-icon">{icon}</span>}
        <span>{children}</span>
      </button>

      <style jsx>{`
        .dropdown-item {
          width: 100%;
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 8px 12px;
          background: none;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          text-align: left;
          font-size: 14px;
          color: var(--text);
          transition: all 0.15s;
        }

        .dropdown-item:hover:not(:disabled) {
          background: #f3f4f6;
        }

        .dropdown-item:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .dropdown-item.danger {
          color: var(--error);
        }

        .dropdown-item.danger:hover:not(:disabled) {
          background: #fef2f2;
        }

        .dropdown-item-icon {
          display: flex;
          align-items: center;
          flex-shrink: 0;
        }

        .dropdown-item:focus-visible {
          outline: 2px solid var(--info);
          outline-offset: -2px;
        }
      `}</style>
    </>
  );
}

export function DropdownDivider() {
  return (
    <>
      <div className="dropdown-divider" role="separator" />
      <style jsx>{`
        .dropdown-divider {
          height: 1px;
          background: var(--border);
          margin: 4px 0;
        }
      `}</style>
    </>
  );
}
