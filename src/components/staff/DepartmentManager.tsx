import { useState, useEffect } from "react";
import { Plus, Trash2, ChevronDown, ChevronRight, Building2, X, Pencil, Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";

interface Department {
  id: string;
  name: string;
  description: string | null;
}

interface SubDepartment {
  id: string;
  department_id: string;
  name: string;
}

interface Props {
  /** user_id to manage assignments for (null = just manage structure) */
  userId?: string | null;
  /** currently assigned sub-department IDs */
  assignedSubDeptIds?: string[];
  /** callback when assignments change */
  onAssignmentsChange?: (subDeptIds: string[]) => void;
  /** read-only mode */
  readOnly?: boolean;
}

export default function DepartmentManager({ userId, assignedSubDeptIds = [], onAssignmentsChange, readOnly = false }: Props) {
  const { user, isCeo } = useAuth();
  const [departments, setDepartments] = useState<Department[]>([]);
  const [subDepartments, setSubDepartments] = useState<SubDepartment[]>([]);
  const [expandedDepts, setExpandedDepts] = useState<Set<string>>(new Set());
  const [newDeptName, setNewDeptName] = useState("");
  const [newSubDeptName, setNewSubDeptName] = useState<Record<string, string>>({});
  const [showAddDept, setShowAddDept] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set(assignedSubDeptIds));
  const [renamingDept, setRenamingDept] = useState<string | null>(null);
  const [renamingSub, setRenamingSub] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    setSelected(new Set(assignedSubDeptIds));
  }, [assignedSubDeptIds]);

  const loadData = async () => {
    const [{ data: depts }, { data: subs }] = await Promise.all([
      supabase.from("departments").select("*").order("name"),
      supabase.from("sub_departments").select("*").order("name"),
    ]);
    setDepartments((depts as Department[]) || []);
    setSubDepartments((subs as SubDepartment[]) || []);
    // Auto-expand departments that have assigned sub-depts
    if (assignedSubDeptIds.length > 0 && subs) {
      const deptIds = new Set(subs.filter((s: SubDepartment) => assignedSubDeptIds.includes(s.id)).map((s: SubDepartment) => s.department_id));
      setExpandedDepts(deptIds);
    }
  };

  const toggleExpand = (deptId: string) => {
    setExpandedDepts(prev => {
      const next = new Set(prev);
      next.has(deptId) ? next.delete(deptId) : next.add(deptId);
      return next;
    });
  };

  const toggleSubDept = (subId: string) => {
    if (readOnly) return;
    const next = new Set(selected);
    next.has(subId) ? next.delete(subId) : next.add(subId);
    setSelected(next);
    onAssignmentsChange?.(Array.from(next));
  };

  const addDepartment = async () => {
    if (!newDeptName.trim() || !user) return;
    const { error } = await supabase.from("departments").insert({
      name: newDeptName.trim(),
      created_by: user.id,
    } as any);
    if (error) {
      toast.error(error.message.includes("unique") ? "Department already exists" : error.message);
      return;
    }
    setNewDeptName("");
    setShowAddDept(false);
    loadData();
    toast.success("Department created");
  };

  const addSubDepartment = async (deptId: string) => {
    const name = newSubDeptName[deptId]?.trim();
    if (!name || !user) return;
    const { error } = await supabase.from("sub_departments").insert({
      department_id: deptId,
      name,
      created_by: user.id,
    } as any);
    if (error) {
      toast.error(error.message.includes("unique") ? "Sub-department already exists" : error.message);
      return;
    }
    setNewSubDeptName(prev => ({ ...prev, [deptId]: "" }));
    loadData();
    toast.success("Sub-department added");
  };

  const deleteDepartment = async (deptId: string) => {
    if (!confirm("Delete this department and all its sub-departments?")) return;
    await supabase.from("departments").delete().eq("id", deptId);
    loadData();
    toast.success("Department deleted");
  };

  const deleteSubDepartment = async (subId: string) => {
    if (!confirm("Remove this sub-department?")) return;
    await supabase.from("sub_departments").delete().eq("id", subId);
    loadData();
    toast.success("Sub-department removed");
  };

  const startRenameDept = (dept: Department) => {
    setRenamingDept(dept.id);
    setRenamingSub(null);
    setRenameValue(dept.name);
  };
  const startRenameSub = (sub: SubDepartment) => {
    setRenamingSub(sub.id);
    setRenamingDept(null);
    setRenameValue(sub.name);
  };
  const cancelRename = () => { setRenamingDept(null); setRenamingSub(null); setRenameValue(""); };
  const saveRenameDept = async (deptId: string) => {
    const name = renameValue.trim();
    if (!name) return;
    const { error } = await supabase.from("departments").update({ name }).eq("id", deptId);
    if (error) { toast.error(error.message); return; }
    cancelRename();
    loadData();
    toast.success("Department renamed");
  };
  const saveRenameSub = async (subId: string) => {
    const name = renameValue.trim();
    if (!name) return;
    const { error } = await supabase.from("sub_departments").update({ name }).eq("id", subId);
    if (error) { toast.error(error.message); return; }
    cancelRename();
    loadData();
    toast.success("Sub-department renamed");
  };

  return (
    <div className="space-y-2">
      {departments.map(dept => {
        const subs = subDepartments.filter(s => s.department_id === dept.id);
        const isExpanded = expandedDepts.has(dept.id);
        const assignedCount = subs.filter(s => selected.has(s.id)).length;

        return (
          <div key={dept.id} className="border border-border rounded-lg overflow-hidden">
            <div
              className="flex items-center gap-2 px-3 py-2.5 bg-muted/50 cursor-pointer hover:bg-muted transition-colors"
              onClick={() => toggleExpand(dept.id)}
            >
              {isExpanded ? <ChevronDown className="w-4 h-4 text-muted-foreground" /> : <ChevronRight className="w-4 h-4 text-muted-foreground" />}
              <Building2 className="w-4 h-4 text-primary" />
              {renamingDept === dept.id ? (
                <div className="flex-1 flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                  <Input
                    autoFocus
                    value={renameValue}
                    onChange={(e) => setRenameValue(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") saveRenameDept(dept.id); if (e.key === "Escape") cancelRename(); }}
                    className="h-7 text-xs"
                  />
                  <Button size="sm" variant="ghost" className="h-7 px-2" onClick={() => saveRenameDept(dept.id)}><Check className="w-3 h-3" /></Button>
                  <Button size="sm" variant="ghost" className="h-7 px-2" onClick={cancelRename}><X className="w-3 h-3" /></Button>
                </div>
              ) : (
                <span className="text-sm font-heading font-semibold text-foreground flex-1">{dept.name}</span>
              )}
              {assignedCount > 0 && (
                <span className="text-[10px] bg-primary text-primary-foreground px-1.5 py-0.5 rounded-full font-bold">{assignedCount}</span>
              )}
              <span className="text-[10px] text-muted-foreground">{subs.length} sub-depts</span>
              {isCeo && !readOnly && renamingDept !== dept.id && (
                <>
                  <button onClick={(e) => { e.stopPropagation(); startRenameDept(dept); }} className="text-muted-foreground hover:text-primary transition-colors p-0.5" title="Rename">
                    <Pencil className="w-3 h-3" />
                  </button>
                  <button onClick={(e) => { e.stopPropagation(); deleteDepartment(dept.id); }} className="text-muted-foreground hover:text-destructive transition-colors p-0.5" title="Delete">
                    <Trash2 className="w-3 h-3" />
                  </button>
                </>
              )}
            </div>

            {isExpanded && (
              <div className="px-3 py-2 space-y-1.5 bg-background">
                {subs.map(sub => (
                  <div key={sub.id} className="flex items-center gap-2 group">
                    <Checkbox
                      id={`sub-${sub.id}`}
                      checked={selected.has(sub.id)}
                      onCheckedChange={() => toggleSubDept(sub.id)}
                      disabled={readOnly}
                    />
                    {renamingSub === sub.id ? (
                      <div className="flex-1 flex items-center gap-1">
                        <Input
                          autoFocus
                          value={renameValue}
                          onChange={(e) => setRenameValue(e.target.value)}
                          onKeyDown={(e) => { if (e.key === "Enter") saveRenameSub(sub.id); if (e.key === "Escape") cancelRename(); }}
                          className="h-7 text-xs"
                        />
                        <Button size="sm" variant="ghost" className="h-7 px-2" onClick={() => saveRenameSub(sub.id)}><Check className="w-3 h-3" /></Button>
                        <Button size="sm" variant="ghost" className="h-7 px-2" onClick={cancelRename}><X className="w-3 h-3" /></Button>
                      </div>
                    ) : (
                      <Label htmlFor={`sub-${sub.id}`} className="text-sm cursor-pointer flex-1">{sub.name}</Label>
                    )}
                    {isCeo && !readOnly && renamingSub !== sub.id && (
                      <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1 transition-opacity">
                        <button onClick={() => startRenameSub(sub)} className="text-muted-foreground hover:text-primary p-0.5" title="Rename">
                          <Pencil className="w-3 h-3" />
                        </button>
                        <button onClick={() => deleteSubDepartment(sub.id)} className="text-muted-foreground hover:text-destructive p-0.5" title="Delete">
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    )}
                  </div>
                ))}

                {isCeo && !readOnly && (
                  <div className="flex items-center gap-1.5 pt-1">
                    <Input
                      placeholder="Add new sub-department…"
                      value={newSubDeptName[dept.id] || ""}
                      onChange={(e) => setNewSubDeptName(prev => ({ ...prev, [dept.id]: e.target.value }))}
                      onKeyDown={(e) => e.key === "Enter" && addSubDepartment(dept.id)}
                      className="h-7 text-xs"
                    />
                    <Button size="sm" variant="ghost" onClick={() => addSubDepartment(dept.id)} className="h-7 px-2">
                      <Plus className="w-3 h-3" />
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}

      {isCeo && !readOnly && (
        <>
          {showAddDept ? (
            <div className="flex items-center gap-2 p-2 border border-dashed border-primary/30 rounded-lg">
              <Input
                placeholder="New department name"
                value={newDeptName}
                onChange={(e) => setNewDeptName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addDepartment()}
                className="h-8 text-sm"
                autoFocus
              />
              <Button size="sm" onClick={addDepartment} className="h-8 gradient-brand text-primary-foreground">Add</Button>
              <Button size="sm" variant="ghost" onClick={() => setShowAddDept(false)} className="h-8"><X className="w-3 h-3" /></Button>
            </div>
          ) : (
            <Button variant="outline" size="sm" onClick={() => setShowAddDept(true)} className="w-full gap-1.5 text-xs border-dashed">
              <Plus className="w-3 h-3" />Add New Department
            </Button>
          )}
        </>
      )}
    </div>
  );
}
