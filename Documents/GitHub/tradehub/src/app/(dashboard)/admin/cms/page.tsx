export const dynamic = "force-dynamic";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/actions/auth";
import { getCmsPages, upsertCmsPage, deleteCmsPage } from "@/lib/actions/admin";
import { LayoutTemplate, Plus, Trash2, Eye, EyeOff } from "lucide-react";
import { formatDate } from "@/lib/utils";


const PREDEFINED_SECTIONS = [
  {
    slug: "homepage_hero",
    title: "Homepage Hero",
    description: "Main headline, subtext, and CTA on the landing page",
    fields: [
      { key: "headline",    label: "Headline",    type: "text",     placeholder: "Professional Trading, Simplified." },
      { key: "subtext",     label: "Subtext",     type: "textarea", placeholder: "Discover copy trading, mentorship, and structured investments." },
      { key: "cta_text",    label: "CTA Button",  type: "text",     placeholder: "Get Started Free" },
      { key: "cta_url",     label: "CTA URL",     type: "text",     placeholder: "/register" },
      { key: "badge_text",  label: "Badge Text",  type: "text",     placeholder: "Trusted by 1,200+ traders worldwide" },
    ],
  },
  {
    slug: "about",
    title: "About Page",
    description: "Company mission, vision, and story",
    fields: [
      { key: "headline",    label: "Headline",    type: "text",     placeholder: "Who We Are" },
      { key: "description", label: "Description", type: "textarea", placeholder: "Our story..." },
      { key: "mission",     label: "Mission",     type: "textarea", placeholder: "Our mission..." },
      { key: "vision",      label: "Vision",      type: "textarea", placeholder: "Our vision..." },
    ],
  },
  {
    slug: "contact",
    title: "Contact Info",
    description: "Support email, phone, and office details",
    fields: [
      { key: "email",   label: "Support Email", type: "text", placeholder: "support@stoxoptionhub.com" },
      { key: "phone",   label: "Phone",         type: "text", placeholder: "+1 (800) 000-0000" },
      { key: "address", label: "Address",       type: "text", placeholder: "123 Market St, New York, NY 10001" },
      { key: "hours",   label: "Hours",         type: "text", placeholder: "Mon–Fri, 9am – 6pm EST" },
    ],
  },
  {
    slug: "terms",
    title: "Terms of Service",
    description: "Full terms of service text",
    fields: [
      { key: "content", label: "Content (Markdown/Plain text)", type: "textarea", placeholder: "1. Introduction\n\nThese Terms of Service govern..." },
    ],
  },
  {
    slug: "privacy",
    title: "Privacy Policy",
    description: "Data handling and privacy policy",
    fields: [
      { key: "content", label: "Content (Markdown/Plain text)", type: "textarea", placeholder: "This Privacy Policy describes how we collect and use..." },
    ],
  },
  {
    slug: "risk_disclosure",
    title: "Risk Disclosure",
    description: "Trading risk warnings and disclaimers",
    fields: [
      { key: "content", label: "Content", type: "textarea", placeholder: "Trading financial instruments involves substantial risk of loss..." },
    ],
  },
];

function parseContent(raw: string) {
  try { return JSON.parse(raw); } catch { return {}; }
}

export default async function CmsPage({
  searchParams,
}: {
  searchParams: Promise<{ section?: string; msg?: string; edit?: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role !== "ADMIN") redirect("/dashboard");

  const sp = await searchParams;
  const activeEdit = sp.edit;

  const pages = await getCmsPages();
  const pagesMap = Object.fromEntries(pages.map((p) => [p.slug, p]));

  return (
    <div>
      <div className="mb-8">
        <div className="flex items-center gap-2.5 mb-1">
          <LayoutTemplate size={20} className="text-[#f0b429]" />
          <h1 className="text-2xl font-bold text-white">Content Management</h1>
        </div>
        <p className="text-[13px] text-[#555] ml-[28px]">
          Edit key sections of your marketing pages without code deployments.
        </p>
      </div>

      {sp.msg === "ok" && (
        <div className="mb-6 px-4 py-3 rounded-lg bg-[#22c55e]/10 text-[#22c55e] border border-[#22c55e]/20 text-[13px] font-medium">
          Section saved successfully.
        </div>
      )}
      {sp.msg === "deleted" && (
        <div className="mb-6 px-4 py-3 rounded-lg bg-[#555]/10 text-[#888] border border-[#555]/20 text-[13px] font-medium">
          Section content cleared.
        </div>
      )}

      <div className="space-y-4">
        {PREDEFINED_SECTIONS.map((section) => {
          const existing = pagesMap[section.slug];
          const content = parseContent(existing?.content ?? "{}");
          const isEditing = activeEdit === section.slug;
          const isPublished = existing?.isPublished ?? true;

          return (
            <div
              key={section.slug}
              className="bg-[#111] border border-[#1e1e1e] rounded-xl overflow-hidden"
            >
              {/* Section header */}
              <div className="px-5 py-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-[14px] font-semibold text-white">{section.title}</h3>
                      {existing ? (
                        <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider ${
                          isPublished ? "bg-[#22c55e]/10 text-[#22c55e]" : "bg-[#555]/10 text-[#888]"
                        }`}>
                          {isPublished ? "Published" : "Draft"}
                        </span>
                      ) : (
                        <span className="text-[9px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider bg-[#1e1e1e] text-[#444]">
                          Empty
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-[#555] mt-0.5">{section.description}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {existing && (
                    <>
                      <form
                        action={async () => {
                          "use server";
                          await upsertCmsPage(section.slug, {
                            title: section.title,
                            content: existing.content,
                            isPublished: !isPublished,
                          });
                          redirect(`/admin/cms?msg=ok`);
                        }}
                      >
                        <button
                          type="submit"
                          title={isPublished ? "Set as draft" : "Publish"}
                          className="p-1.5 rounded-lg hover:bg-[#1e1e1e] text-[#555] hover:text-[#888] transition-colors"
                        >
                          {isPublished ? <EyeOff size={13} /> : <Eye size={13} />}
                        </button>
                      </form>
                      <form
                        action={async () => {
                          "use server";
                          await deleteCmsPage(existing.id);
                          redirect(`/admin/cms?msg=deleted`);
                        }}
                      >
                        <button
                          type="submit"
                          title="Clear section"
                          className="p-1.5 rounded-lg hover:bg-[#1e1e1e] text-[#555] hover:text-[#ef4444] transition-colors"
                        >
                          <Trash2 size={13} />
                        </button>
                      </form>
                    </>
                  )}
                  <a
                    href={`/admin/cms?edit=${isEditing ? "" : section.slug}`}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold transition-colors ${
                      isEditing
                        ? "bg-[#1e1e1e] text-[#555]"
                        : "bg-[#f0b429]/10 text-[#f0b429] hover:bg-[#f0b429]/20"
                    }`}
                  >
                    {isEditing ? "Close" : existing ? "Edit" : <><Plus size={11} /> Add</>}
                  </a>
                </div>
              </div>

              {/* Edit form */}
              {isEditing && (
                <div className="border-t border-[#1e1e1e] p-5">
                  {existing && (
                    <p className="text-[11px] text-[#444] mb-4">
                      Last updated: {formatDate(existing.updatedAt)}
                    </p>
                  )}
                  <form
                    action={async (fd: FormData) => {
                      "use server";
                      const data: Record<string, string> = {};
                      for (const field of section.fields) {
                        data[field.key] = (fd.get(field.key) as string) ?? "";
                      }
                      await upsertCmsPage(section.slug, {
                        title: section.title,
                        content: JSON.stringify(data),
                        isPublished: true,
                      });
                      redirect(`/admin/cms?msg=ok`);
                    }}
                    className="space-y-4"
                  >
                    {section.fields.map((field) => (
                      <div key={field.key}>
                        <label className="block text-[11px] text-[#555] uppercase tracking-wider mb-1.5">
                          {field.label}
                        </label>
                        {field.type === "textarea" ? (
                          <textarea
                            name={field.key}
                            rows={4}
                            defaultValue={content[field.key] ?? ""}
                            placeholder={field.placeholder}
                            className="w-full px-3 py-2 bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg text-[13px] text-white placeholder-[#333] outline-none focus:border-[#f0b429]/40 resize-y"
                          />
                        ) : (
                          <input
                            name={field.key}
                            type="text"
                            defaultValue={content[field.key] ?? ""}
                            placeholder={field.placeholder}
                            className="w-full px-3 py-2 bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg text-[13px] text-white placeholder-[#333] outline-none focus:border-[#f0b429]/40"
                          />
                        )}
                      </div>
                    ))}
                    <div className="flex gap-3 pt-1">
                      <button
                        type="submit"
                        className="px-4 py-2 bg-[#f0b429] text-black text-[12px] font-bold rounded-lg hover:bg-[#e0a820] transition-colors"
                      >
                        Save & Publish
                      </button>
                      <a
                        href="/admin/cms"
                        className="px-4 py-2 bg-[#1e1e1e] text-[#555] text-[12px] font-medium rounded-lg hover:text-[#888] transition-colors"
                      >
                        Cancel
                      </a>
                    </div>
                  </form>
                </div>
              )}

              {/* Content preview */}
              {!isEditing && existing && Object.keys(content).length > 0 && (
                <div className="border-t border-[#1a1a1a] px-5 py-3">
                  <div className="flex flex-wrap gap-x-6 gap-y-1">
                    {Object.entries(content).slice(0, 3).map(([k, v]) => (
                      <span key={k} className="text-[11px] text-[#444]">
                        <span className="text-[#333] capitalize">{k.replace(/_/g, " ")}:</span>{" "}
                        <span className="text-[#666]">{String(v).slice(0, 50)}{String(v).length > 50 ? "…" : ""}</span>
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
