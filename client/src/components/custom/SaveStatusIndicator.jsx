import React from "react";
import { useSelector } from "react-redux";
import { Check, Loader2, AlertCircle, Cloud } from "lucide-react";

const STATUS_CONFIG = {
  saved: {
    icon: Check,
    text: "Saved",
    className: "text-green-600",
  },
  saving: {
    icon: Loader2,
    text: "Saving…",
    className: "text-slate-500",
    spin: true,
  },
  unsaved: {
    icon: Cloud,
    text: "Unsaved changes",
    className: "text-amber-500",
  },
  error: {
    icon: AlertCircle,
    text: "Save failed",
    className: "text-red-500",
  },
};

function SaveStatusIndicator() {
  const saveStatus = useSelector((state) => state.editResume.saveStatus);
  const config = STATUS_CONFIG[saveStatus] || STATUS_CONFIG.saved;
  const Icon = config.icon;

  return (
    <div className={`flex items-center gap-1.5 text-xs font-medium ${config.className} transition-colors duration-300`}>
      <Icon className={`h-3.5 w-3.5 ${config.spin ? "animate-spin" : ""}`} />
      <span>{config.text}</span>
    </div>
  );
}

export default SaveStatusIndicator;
