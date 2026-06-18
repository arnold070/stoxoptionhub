import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/actions/auth";
import { getContents, createContent, updateContent, deleteContent } from "@/lib/actions/admin";
import { formatDate } from "@/lib/utils";
import { BookOpen, Plus, Trash2, Eye, EyeOff } from "lucide-react";
import type { ContentType } from "@/generated/prisma/enums";

const TYPE_COLORS: Record<ContentType, string> = {
  VIDEO:    "bg-[#ef4444]/10 text-[#ef4444]",
  PDF:      "bg-[#818cf8]/10 text-[#818cf8]",
  RESOURCE: "bg-[#22c55e]/10 text-[#22c55e]",
  REPLAY:   "bg-[#f0b429]/10 text-[#f0b429]",
};

export default async function AdminContentPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role !== "ADMIN") redirect("/dashboard");

  const contents = await getContents({ limit: 50 });

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Content Management</h1>
        <p className="text-[13px] text-[#555] mt-1">Manage videos, PDFs, resources and session replays</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Create form */}
        <div className="bg-[#111] rounded-xl border border-[#1e1e1e] p-5">
          <div className="flex items-center gap-2 mb-5 pb-4 border-b border-[#1e1e1e]">
            <Plus size={14} className="text-[#f0b429]" />
            <h2 className="font-semibold text-white text-[14px]">Add Content</h2>
          </div>
          <form action={async (fd: FormData) => {
            "use server";
            await createContent({
              title: fd.get("title") as string,
              description: fd.get("description") as string || undefined,
              type: fd.get("type") as ContentType,
              url: fd.get("url") as string,
              thumbnailUrl: fd.get("thumbnailUrl") as string || undefined,
              membershipRequired: fd.get("membershipRequired") === "on",
              duration: fd.get("duration") ? Number(fd.get("duration")) : undefined,
            });
          }} className="space-y-3">
            <div>
              <label className="text-[11px] text-[#666] uppercase tracking-wider block mb-1">Title *</label>
              <input name="title" required placeholder="Content title" className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg px-3 py-2 text-[13px] text-white placeholder-[#444] outline-none focus:border-[#f0b429]/50" />
            </div>
            <div>
              <label className="text-[11px] text-[#666] uppercase tracking-wider block mb-1">Type *</label>
              <select name="type" required className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg px-3 py-2 text-[13px] text-white outline-none focus:border-[#f0b429]/50">
                <option value="">Select type</option>
                {(["VIDEO", "PDF", "RESOURCE", "REPLAY"] as ContentType[]).map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-[11px] text-[#666] uppercase tracking-wider block mb-1">URL *</label>
              <input name="url" required placeholder="https://..." className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg px-3 py-2 text-[13px] text-white placeholder-[#444] outline-none focus:border-[#f0b429]/50" />
            </div>
            <div>
              <label className="text-[11px] text-[#666] uppercase tracking-wider block mb-1">Thumbnail URL</label>
              <input name="thumbnailUrl" placeholder="https://..." className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg px-3 py-2 text-[13px] text-white placeholder-[#444] outline-none focus:border-[#f0b429]/50" />
            </div>
            <div>
              <label className="text-[11px] text-[#666] uppercase tracking-wider block mb-1">Description</label>
              <textarea name="description" rows={2} className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg px-3 py-2 text-[13px] text-white placeholder-[#444] outline-none focus:border-[#f0b429]/50 resize-none" />
            </div>
            <div>
              <label className="text-[11px] text-[#666] uppercase tracking-wider block mb-1">Duration (minutes)</label>
              <input name="duration" type="number" min="1" placeholder="Optional" className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg px-3 py-2 text-[13px] text-white placeholder-[#444] outline-none focus:border-[#f0b429]/50" />
            </div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" name="membershipRequired" className="accent-[#f0b429]" />
              <span className="text-[12px] text-[#888]">Members only</span>
            </label>
            <button type="submit" className="w-full py-2 bg-[#f0b429] hover:bg-[#e0a424] rounded-lg text-[13px] font-bold text-black transition-colors">
              Add Content
            </button>
          </form>
        </div>

        {/* Content list */}
        <div className="lg:col-span-2 space-y-3">
          {contents.length === 0 && (
            <div className="bg-[#111] rounded-xl border border-[#1e1e1e] p-10 text-center">
              <BookOpen size={28} className="text-[#333] mx-auto mb-3" />
              <p className="text-[#555] text-[13px]">No content yet</p>
            </div>
          )}
          {contents.map((c) => (
            <div key={c.id} className="bg-[#111] rounded-xl border border-[#1e1e1e] p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase ${TYPE_COLORS[c.type]}`}>{c.type}</span>
                    <h3 className="font-semibold text-white text-[13px]">{c.title}</h3>
                    {c.membershipRequired && <span className="text-[9px] bg-[#f0b429]/10 text-[#f0b429] px-1.5 py-0.5 rounded font-bold">MEMBERS</span>}
                  </div>
                  {c.description && <p className="text-[11px] text-[#666] mb-1">{c.description}</p>}
                  <p className="text-[10px] text-[#444] truncate">{c.url}</p>
                  <p className="text-[10px] text-[#444] mt-0.5">Added {formatDate(c.createdAt)}{c.duration ? ` · ${c.duration}min` : ""}</p>
                </div>
                <div className="flex flex-col gap-1.5 shrink-0">
                  <form action={async () => { "use server"; await updateContent(c.id, { isPublished: !c.isPublished }); }}>
                    <button type="submit" className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold transition-colors w-full justify-center ${
                      c.isPublished
                        ? "bg-[#f0b429]/10 text-[#f0b429] hover:bg-[#f0b429]/20"
                        : "bg-[#22c55e]/10 text-[#22c55e] hover:bg-[#22c55e]/20"
                    }`}>
                      {c.isPublished ? <><EyeOff size={11} /> Unpublish</> : <><Eye size={11} /> Publish</>}
                    </button>
                  </form>
                  <form action={async () => { "use server"; await deleteContent(c.id); }}>
                    <button type="submit" className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-[#1a1a1a] text-[#555] hover:text-[#ef4444] transition-colors w-full justify-center">
                      <Trash2 size={11} /> Delete
                    </button>
                  </form>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
