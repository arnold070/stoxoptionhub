import Link from "next/link";

interface LogoProps {
  href?: string;
  showText?: boolean;
  size?: number;
  textTheme?: "light" | "dark";
  className?: string;
}

export function Logo({
  href,
  showText = true,
  size = 32,
  textTheme = "light",
  className = "",
}: LogoProps) {
  const textColor = textTheme === "dark" ? "#0d0d0d" : "#ffffff";
  const accentColor = textTheme === "dark" ? "#c49000" : "#f0b429";
  const fontSize = Math.max(12, Math.round(size * 0.44));

  const inner = (
    <span
      className={`flex items-center gap-2.5 shrink-0 ${className}`}
      style={{ lineHeight: 1 }}
    >
      {/* Geometric S-mark on gold rounded square */}
      <svg
        width={size}
        height={size}
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
        style={{ flexShrink: 0 }}
      >
        <rect x="5" y="5" width="90" height="90" rx="15" fill="#f0b429" />
        <path
          d="M30,22 L62,22 L70,30 L70,42 L62,50 L38,50 L30,58 L30,70 L38,78 L70,78"
          stroke="#0d0d0d"
          strokeWidth="14"
          strokeLinecap="square"
          strokeLinejoin="miter"
        />
      </svg>

      {showText && (
        <span
          style={{
            fontSize,
            letterSpacing: "-0.3px",
            color: textColor,
            fontWeight: 800,
            fontFamily:
              "var(--font-geist-sans), 'Inter', system-ui, -apple-system, sans-serif",
          }}
        >
          Stox
          <span style={{ color: accentColor, fontWeight: 500 }}>Option</span>
          Hub
        </span>
      )}
    </span>
  );

  if (href) {
    return (
      <Link href={href} aria-label="StoxOptionHub home">
        {inner}
      </Link>
    );
  }
  return inner;
}
