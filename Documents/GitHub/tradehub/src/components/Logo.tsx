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
  const textColorClass = textTheme === "dark" ? "text-[#0d0d0d]" : "text-white";
  const accentColorClass =
    textTheme === "dark" ? "text-[#c49000]" : "text-[#f0b429]";

  const sharedClass = `flex items-center gap-2.5 shrink-0 leading-none ${className}`;

  const children = (
    <>
      {/* Gold rounded-square with chamfered angular S mark */}
      <svg
        width={size}
        height={size}
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
        className="block shrink-0"
      >
        <rect x="5" y="5" width="90" height="90" rx="15" fill="#f0b429" />
        <path
          d="M30,22 L62,22 L70,30 L70,42 L62,50 L38,50 L30,58 L30,70 L38,78 L70,78"
          fill="none"
          stroke="#0d0d0d"
          strokeWidth="14"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>

      {showText && (
        <span
          className={`text-[15px] font-extrabold tracking-tight ${textColorClass}`}
        >
          Stox
          <span className={`font-medium ${accentColorClass}`}>Option</span>
          Hub
        </span>
      )}
    </>
  );

  if (href) {
    return (
      <Link
        href={href}
        aria-label="StoxOptionHub home"
        className={sharedClass}
      >
        {children}
      </Link>
    );
  }

  return <span className={sharedClass}>{children}</span>;
}
