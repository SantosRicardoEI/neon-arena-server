import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import starLogo from "@/assets/star-logo.png";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div
      className="flex min-h-screen items-center justify-center bg-background bg-cover bg-center px-6"
      style={{ backgroundImage: "url('/background.png')" }}
    >
      <div className="text-center space-y-8">
        <img
          src={starLogo}
          alt="Neon Arena Logo"
          className="w-28 h-28 mx-auto drop-shadow-[0_0_30px_hsla(210,100%,70%,0.6)] animate-pulse-slow"
        />

        <div className="space-y-3">
          <h1 className="text-5xl font-bold text-foreground title-glow font-tabular tracking-wider">
            404
          </h1>

          <p className="text-muted-foreground text-sm font-tabular tracking-wider uppercase">
            Arena not found
          </p>

          <p className="text-muted-foreground/80 text-xs max-w-md mx-auto">
            The route <span className="text-foreground">{location.pathname}</span> does not exist.
          </p>
        </div>

        <Link
          to="/"
          className="inline-block bg-primary text-primary-foreground px-8 py-3 text-sm font-bold tracking-widest uppercase hover:opacity-90 transition-opacity rounded-sm"
        >
          Return Home
        </Link>
      </div>
    </div>
  );
};

export default NotFound;
