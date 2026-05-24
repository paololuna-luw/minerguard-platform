declare module "lucide-react" {
  import type { ComponentType, SVGProps } from "react";

  export type LucideIcon = ComponentType<SVGProps<SVGSVGElement> & { size?: number | string }>;

  export const Activity: LucideIcon;
  export const AlertTriangle: LucideIcon;
  export const Battery: LucideIcon;
  export const HardHat: LucideIcon;
  export const RadioTower: LucideIcon;
  export const Users: LucideIcon;
}
