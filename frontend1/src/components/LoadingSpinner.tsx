import { Loader2 } from "lucide-react";

const LoadingSpinner = ({ text = "Loading..." }: { text?: string }) => (
  <div className="flex flex-col items-center justify-center py-20 gap-3">
    <Loader2 className="w-8 h-8 animate-spin text-primary" />
    <p className="text-sm text-muted-foreground">{text}</p>
  </div>
);

export default LoadingSpinner;
