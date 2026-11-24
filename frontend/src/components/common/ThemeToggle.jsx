import { useTheme } from "../../hooks/useTheme";

// Sun / moon button for the top bar, next to the account button.
export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";

  return (
    <button
      type="button"
      className="dashq-theme-toggle"
      onClick={toggleTheme}
      aria-label={isDark ? "Switch to light theme" : "Switch to dark theme"}
      title={isDark ? "Light theme" : "Dark theme"}
    >
      <i className={`bi ${isDark ? "bi-sun" : "bi-moon-stars"}`} aria-hidden="true" />
    </button>
  );
}
