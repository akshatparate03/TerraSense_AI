// Converts raw backend field names (snake_case, e.g. "rainfall_mm",
// "trigger_is_rain") into readable Title Case labels for display
// ("Rainfall Mm", "Trigger Is Rain"). Used anywhere a raw object key or
// dataset column name would otherwise be shown directly to the user.
export function humanize(key) {
  if (!key) return "";
  return String(key)
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

// Capitalizes a single word/category value, e.g. "medium" -> "Medium".
export function titleCase(value) {
  if (!value) return "";
  return String(value)
    .split(" ")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}
