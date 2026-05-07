import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { ALL_MODULES, ALL_ACTIONS, type ModuleAction, type PermissionMap } from "@/hooks/usePermissions";

interface Props {
  value: PermissionMap;
  onChange: (next: PermissionMap) => void;
  disabled?: boolean;
}

const ACTION_LABELS: Record<ModuleAction, string> = {
  view: "View",
  create: "Create",
  edit: "Edit",
  delete: "Delete",
  manage: "Manage (full)",
};

export default function ModuleActionMatrix({ value, onChange, disabled }: Props) {
  const toggle = (module: string, action: ModuleAction) => {
    const next: PermissionMap = { ...value };
    const set = new Set(next[module] || []);
    set.has(action) ? set.delete(action) : set.add(action);
    if (set.size === 0) delete next[module];
    else next[module] = set;
    onChange(next);
  };

  const toggleRowAll = (module: string) => {
    const next: PermissionMap = { ...value };
    const cur = next[module] || new Set<ModuleAction>();
    if (cur.size === ALL_ACTIONS.length) delete next[module];
    else next[module] = new Set(ALL_ACTIONS);
    onChange(next);
  };

  const allEverything = ALL_MODULES.every((m) => (value[m.key]?.size || 0) === ALL_ACTIONS.length);

  const grantAll = () => {
    if (allEverything) {
      onChange({});
      return;
    }
    const next: PermissionMap = {};
    ALL_MODULES.forEach((m) => { next[m.key] = new Set(ALL_ACTIONS); });
    onChange(next);
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between border-b border-border pb-2 mb-2">
        <span className="text-xs font-heading font-semibold text-muted-foreground uppercase tracking-wider">Module / Action</span>
        <button
          type="button"
          onClick={grantAll}
          disabled={disabled}
          className="text-xs font-heading text-primary hover:underline"
        >
          {allEverything ? "Clear all" : "Grant everything"}
        </button>
      </div>
      <div className="overflow-x-auto -mx-1">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-xs text-muted-foreground">
              <th className="text-left py-1.5 px-2 font-medium">Module</th>
              {ALL_ACTIONS.map((a) => (
                <th key={a} className="px-1.5 py-1.5 font-medium text-center">{ACTION_LABELS[a]}</th>
              ))}
              <th className="px-2 py-1.5 text-right font-medium">All</th>
            </tr>
          </thead>
          <tbody>
            {ALL_MODULES.map((m) => {
              const set = value[m.key] || new Set<ModuleAction>();
              const allRow = set.size === ALL_ACTIONS.length;
              return (
                <tr key={m.key} className="border-t border-border/60 hover:bg-muted/30">
                  <td className="py-1.5 px-2">
                    <Label className="font-medium text-foreground cursor-default">{m.label}</Label>
                  </td>
                  {ALL_ACTIONS.map((a) => (
                    <td key={a} className="px-1.5 py-1.5 text-center">
                      <Checkbox
                        checked={set.has(a)}
                        onCheckedChange={() => toggle(m.key, a)}
                        disabled={disabled}
                      />
                    </td>
                  ))}
                  <td className="px-2 py-1.5 text-right">
                    <button
                      type="button"
                      onClick={() => toggleRowAll(m.key)}
                      disabled={disabled}
                      className="text-[11px] text-primary hover:underline"
                    >
                      {allRow ? "Clear" : "All"}
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p className="text-[11px] text-muted-foreground pt-1">
        Grant <strong>View</strong> for the user to see the module in the sidebar. <strong>Manage</strong> implies all actions.
      </p>
    </div>
  );
}
