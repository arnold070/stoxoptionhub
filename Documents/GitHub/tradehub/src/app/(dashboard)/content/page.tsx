import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/actions/auth";
import { getContent } from "@/lib/actions/content";
import { formatDate } from "@/lib/utils";
import { Play, FileText, Lock, BookOpen } from "lucide-react";

const TYPE_ICONS: Record<string, React.ElementType> = {
  VIDEO: Play,
  PDF: FileText,
  REPLAY: Play,
  RESOURCE: BookOpen,
};

export default async function ContentPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const content = await getContent();

  const byType = content.reduce<Record<string, typeof content>>((acc, item) => {
    acc[item.type] = acc[item.type] ?? [];
    acc[item.type].push(item);
    return acc;
  }, {});

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Content Library</h1>
        <p className="text-[13px] text-[#555] mt-1">
          Videos, PDFs, resources and session replays
        </p>
      </div>

      {Object.entries(byType).map(([type, items]) => {
        const Icon = TYPE_ICONS[type] ?? BookOpen;
        return (
          <section key={type} className="mb-10">
            <h2 className="text-[15px] font-semibold text-white mb-4 flex items-center gap-2">
              <Icon size={18} className="text-[#f0b429]" />
              {type.charAt(0) + type.slice(1).toLowerCase()}s
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {items.map((item) => (
                <a
                  key={item.id}
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group bg-[#111] rounded-xl p-5 border border-[#1e1e1e] hover:border-[#f0b429]/40 transition-colors"
                >
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-medium text-white group-hover:text-[#f0b429] transition-colors">
                      {item.title}
                    </h3>
                    {item.membershipRequired && (
                      <Lock size={14} className="text-[#f0b429] shrink-0 mt-0.5 ml-2" />
                    )}
                  </div>
                  {item.description && (
                    <p className="text-[12px] text-[#888] line-clamp-2">
                      {item.description}
                    </p>
                  )}
                  <p className="text-[11px] text-[#444] mt-3">
                    {formatDate(item.createdAt)}
                  </p>
                </a>
              ))}
            </div>
          </section>
        );
      })}

      {content.length === 0 && (
        <div className="text-center py-16 text-[#555]">
          <BookOpen size={48} className="mx-auto mb-4 opacity-30" />
          <p className="text-[13px]">No content available yet.</p>
        </div>
      )}
    </div>
  );
}
