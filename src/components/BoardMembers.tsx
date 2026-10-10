import { Phone, Copy } from "lucide-react";
import { toast } from "sonner";
import { BOARD_MEMBERS, telHref } from "@/config/board";

const initials = (name: string) =>
  name.replace(/^(Mrs?\.|Ms\.)\s*/, "").split(" ").slice(0, 2).map((p) => p[0]).join("");

export default function BoardMembers() {
  return (
    <section className="py-20 bg-background" aria-labelledby="board-heading">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <div className="inline-block px-3 py-1 bg-accent/10 text-cyan text-xs tracking-widest uppercase rounded-full mb-3">
            Leadership
          </div>
          <h2 id="board-heading" className="font-heading font-bold text-4xl md:text-5xl text-foreground">
            Company Leadership Team
          </h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {BOARD_MEMBERS.map((m) => (
            <div key={m.name} className="p-6 bg-card rounded-xl border border-border shadow-card text-center flex flex-col items-center">
              <div className="w-16 h-16 rounded-full bg-[image:var(--gradient-brand)] flex items-center justify-center font-heading font-bold text-white text-xl mb-4">
                {initials(m.name)}
              </div>
              <h3 className="font-heading font-semibold text-lg">{m.name}</h3>
              <p className="text-cyan text-sm mb-4">{m.role}</p>
              <div className="flex items-center gap-2 mt-auto">
                <a href={telHref(m.phone)} className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-border hover:border-cyan-brand text-sm">
                  <Phone className="w-4 h-4" /> {m.phone}
                </a>
                <button
                  type="button"
                  aria-label={`Copy ${m.name}'s number`}
                  onClick={() => navigator.clipboard?.writeText(m.phone).then(() => toast.success("Number copied"))}
                  className="p-2 rounded-lg border border-border hover:border-cyan-brand"
                >
                  <Copy className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
