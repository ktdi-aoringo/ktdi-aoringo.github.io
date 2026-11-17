// Use explicit publication dates, not years embedded in titles or DOI URLs.
export function sortedEntries(section) {
  if (section.sortBy !== "publishedDate") return section.entries;
  for (const entry of section.entries) {
    if (!/^\d{4}(?:-(?:0[1-9]|1[0-2]))?$/.test(entry.publishedDate ?? "")) {
      throw new Error(`Missing or invalid publication date: ${entry.en ?? entry}`);
    }
  }
  return [...section.entries].sort((a, b) =>
    b.publishedDate.localeCompare(a.publishedDate)
  );
}
