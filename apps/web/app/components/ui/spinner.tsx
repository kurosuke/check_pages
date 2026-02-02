type SpinnerProps = {
  size?: number;
  color?: string;
  className?: string;
};

export function Spinner({ size = 16, color = "var(--primary)", className = "" }: SpinnerProps) {
  return (
    <>
      <span className={`spinner ${className}`} role="status" aria-label="読み込み中" />
      <style jsx>{`
        .spinner {
          display: inline-block;
          width: ${size}px;
          height: ${size}px;
          border: 2px solid var(--border);
          border-top-color: ${color};
          border-radius: 50%;
          animation: spin 0.6s linear infinite;
        }

        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </>
  );
}

type ButtonSpinnerProps = {
  loading: boolean;
  children: React.ReactNode;
  size?: number;
};

export function ButtonSpinner({ loading, children, size = 14 }: ButtonSpinnerProps) {
  if (loading) {
    return <Spinner size={size} />;
  }
  return <>{children}</>;
}
