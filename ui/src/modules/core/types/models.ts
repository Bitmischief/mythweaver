export interface TipTapTool {
  key: string;
  icon: any;
  tooltip: string;
  toggle: () => void;
  isActive: () => boolean;
}
