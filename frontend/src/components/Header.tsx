import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/apiClient";
import { useAppSelector } from "@/app/hooks";

function Header() {
  const { user } = useAppSelector((state) => state.auth);
  const location = useLocation();

  const navItems = [
    { name: "Dashboard", path: "/dashboard" },
  ];

  const handleLogout = async () => {
    try {
      await api.post("/auth/logout");
      window.location.href = "/login";   
    } catch (error: any) {
      console.error("Logout failed:", error);
    }
  }

  return (
    <header className="w-full  bg-white dark:bg-gray-900 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto flex items-center justify-between px-6 py-3">
        {/* Left: Logo */}
        <Link to="/" className="flex items-center gap-2">
          <span className="font-bold text-xl text-blue-600">Header</span>
        </Link>

        {/* Right: Nav Links */}
        <nav className="hidden md:flex items-center gap-6">
          {navItems.map((item) => (
            <Link
              key={item.name}
              to={item.path}
              className={cn(
                "text-sm font-medium transition-colors hover:text-blue-600",
                location.pathname === item.path
                  ? "text-blue-600"
                  : "text-gray-700 dark:text-gray-300"
              )}
            >
              {item.name}
            </Link>
          ))}
          {
            user && (
              <Button variant="outline" size="sm" onClick={handleLogout}>Logout</Button>
            )
          }
        </nav>

        {/* Mobile menu placeholder (optional) */}
        <div className="md:hidden">
          <Button variant="outline" size="sm">Menu</Button>
        </div>
      </div>
    </header>
  );
}

export default Header;
