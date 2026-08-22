"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { deleteOperator } from "@/lib/actions/operators";

export function DeleteOperatorButton({ id, name, variant = "ghost" }: { id: string; name: string; variant?: "ghost" | "outline" | "danger" }) {
  const [pending, start] = useTransition();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  const onDelete = () => {
    const msg = "Delete operator \"" + name + "\"? If the operator has any history (sessions/fuel/assignments) they will be deactivated instead to preserve records. Active assignments block deletion.";
    if (!confirm(msg)) return;
    setError(null);
    start(async () => {
      const res = await deleteOperator(id);
      if (res?.error) {
        setError(res.error);
        alert(res.error);
      } else {
        if (res?.message) alert(res.message);
        router.refresh();
      }
    });
  };

  return (
    <span className="inline-flex flex-col gap-1">
      <Button
        type="button"
        variant={variant === "danger" ? "danger" : variant}
        size="sm"
        disabled={pending}
        onClick={onDelete}
        title={variant === "ghost" ? "Delete operator" : undefined}
        className={variant === "ghost" ? "h-7 px-2 text-xs text-red-600 hover:bg-red-50 hover:text-red-700" : "text-red-600 hover:bg-red-50"}
      >
        <Trash2 className="h-3.5 w-3.5" /> {pending ? "Deleting…" : "Delete"}
      </Button>
      {error && <span className="text-[11px] text-red-600 max-w-[180px] leading-tight">{error}</span>}
    </span>
  );
}
