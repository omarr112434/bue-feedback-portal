import type { ReactNode } from "react";
import campusBg from "@/assets/campus-bg.jpg";

const BUE_LOGO_URL = "/bue-logo.png";

export function AuthCard({
  subtitle,
  title,
  children,
}: {
  subtitle: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <div
      className="min-h-screen w-full flex flex-col items-center justify-center px-4 py-10 sm:py-16 bg-slate-900"
      style={{
        backgroundImage: `linear-gradient(rgba(15,23,42,0.55), rgba(15,23,42,0.55)), url(${campusBg})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      <div className="w-full max-w-md flex flex-col items-center">
        <img
          src={BUE_LOGO_URL}
          alt="The British University in Egypt"
          className="h-20 md:h-24 w-auto object-contain drop-shadow-lg"
        />

        <div className="mt-6 w-full card-premium px-8 py-10 sm:px-10">
          <h2 className="font-display text-2xl sm:text-3xl text-slate-900 text-center leading-tight">
            {subtitle}
          </h2>
          <h1 className="font-display mt-2 text-3xl sm:text-4xl text-center text-slate-900 italic font-medium">
            {title}
          </h1>

          <div className="mt-8 w-full">{children}</div>
        </div>

        <p className="mt-6 text-xs sm:text-sm text-white/80 text-center tracking-wide">
          The British University in Egypt
        </p>
      </div>
    </div>
  );
}
