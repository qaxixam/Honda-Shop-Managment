import React from "react";
import { UserPlus, UserRound, X } from "lucide-react";
import { money } from "../../lib/utils";
import { Button, IconButton } from "../ui";

export default function CustomerPanel({ customer, onSelect, onAdd, onClear }) {
  return (
    <div className="panel">
      <div className="flex items-center gap-3 px-3 py-2.5">
        <UserRound size={15} className="shrink-0 text-hm-text-subtle" />

        {customer ? (
          <>
            <div className="flex min-w-0 flex-1 items-center gap-2.5">
              <div className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-hm-primary text-hm-meta font-semibold text-white">
                {customer.name
                  .split(" ")
                  .map((x) => x[0])
                  .join("")
                  .slice(0, 2)
                  .toUpperCase()}
              </div>
              <div className="min-w-0">
                <div className="truncate text-hm-body font-medium text-hm-text">
                  {customer.name}
                </div>
                <div className="truncate text-hm-meta text-hm-text-subtle tabular-nums">
                  {customer.phone || "No phone"} · Due{" "}
                  {money(customer.due || 0)}
                </div>
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={onSelect}>
              Change
            </Button>
            <IconButton label="Remove customer" onClick={onClear}>
              <X size={14} />
            </IconButton>
          </>
        ) : (
          <>
            <div className="min-w-0 flex-1">
              <div className="text-hm-body font-medium text-hm-text">
                Walk-in customer
              </div>
              <div className="text-hm-meta text-hm-text-subtle">
                No account attached
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={onSelect}>
              Attach
            </Button>
            <Button variant="ghost" size="sm" onClick={onAdd}>
              <UserPlus size={13} />
              New
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
