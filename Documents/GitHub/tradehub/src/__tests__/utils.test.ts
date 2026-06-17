import { describe, it, expect } from "vitest";
import { cn, formatCurrency, formatDate, generateToken, slugify, paginate } from "@/lib/utils";

describe("cn", () => {
  it("merges class names", () => {
    expect(cn("a", "b")).toBe("a b");
  });

  it("handles conditional classes", () => {
    expect(cn("a", false && "b", "c")).toBe("a c");
  });

  it("deduplicates tailwind classes (last wins)", () => {
    expect(cn("p-2", "p-4")).toBe("p-4");
  });

  it("handles undefined/null gracefully", () => {
    expect(cn(undefined, null as any, "a")).toBe("a");
  });
});

describe("formatCurrency", () => {
  it("formats USD by default", () => {
    expect(formatCurrency(1234.56)).toContain("1,234.56");
  });

  it("formats zero as $0.00", () => {
    expect(formatCurrency(0)).toBe("$0.00");
  });

  it("formats large numbers with commas", () => {
    const result = formatCurrency(1000000);
    expect(result).toContain("1,000,000");
  });
});

describe("formatDate", () => {
  it("formats a date string", () => {
    const result = formatDate("2024-01-15");
    expect(result).toContain("2024");
    expect(result).toContain("Jan");
  });

  it("formats a Date object", () => {
    const result = formatDate(new Date("2024-06-01"));
    expect(result).toContain("2024");
  });
});

describe("generateToken", () => {
  it("generates a token of default length 32", () => {
    const token = generateToken();
    expect(token).toHaveLength(32);
  });

  it("generates a token of custom length", () => {
    expect(generateToken(16)).toHaveLength(16);
    expect(generateToken(64)).toHaveLength(64);
  });

  it("generates unique tokens each call", () => {
    expect(generateToken()).not.toBe(generateToken());
  });
});

describe("slugify", () => {
  it("lowercases and replaces spaces with hyphens", () => {
    expect(slugify("Hello World")).toBe("hello-world");
  });

  it("removes special characters", () => {
    expect(slugify("Hello, World!")).toBe("hello-world");
  });

  it("handles already-slugified input", () => {
    expect(slugify("hello-world")).toBe("hello-world");
  });
});

describe("paginate", () => {
  const items = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

  it("returns first page", () => {
    const result = paginate(items, 1, 3);
    expect(result.items).toEqual([1, 2, 3]);
    expect(result.page).toBe(1);
    expect(result.totalPages).toBe(4);
    expect(result.total).toBe(10);
  });

  it("returns second page", () => {
    const result = paginate(items, 2, 3);
    expect(result.items).toEqual([4, 5, 6]);
  });

  it("returns last page with remaining items", () => {
    const result = paginate(items, 4, 3);
    expect(result.items).toEqual([10]);
  });

  it("handles empty array", () => {
    const result = paginate([], 1, 10);
    expect(result.items).toEqual([]);
    expect(result.total).toBe(0);
    expect(result.totalPages).toBe(0);
  });
});
