import type { ReactNode } from "react";

const BUE_LOGO_URL = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 40'%3E%3Ctext x='50%25' y='50%25' font-size='24' font-weight='bold' font-family='sans-serif' text-anchor='middle' dominant-baseline='middle' fill='%2300BCD4'%3EBUE%3C/text%3E%3C/svg%3E";

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
    <div className="min-h-screen w-full bg-white flex flex-col items-center px-4 py-10 sm:py-16">
      <div className="w-full max-w-md flex flex-col items-center">
        <img
          src={BUE_LOGO_URL}
          alt="The British University in Egypt"
          className="h-20 sm:h-24 w-auto object-contain"
        />
        <p className="mt-4 text-base sm:text-lg text-neutral-700 text-center">
          The British University in Egypt
        </p>

        <div className="mt-12 w-full flex flex-col items-center">
          <h2 className="text-lg sm:text-xl font-semibold text-neutral-900 text-center">
            {subtitle}
          </h2>
          <h1
            className="mt-3 text-4xl sm:text-5xl font-normal text-center"
            style={{ color: "#00BCD4" }}
          >
            {title}
          </h1>

          <div className="mt-6 w-full">{children}</div>
        </div>
      </div>
    </div>
  );
}
