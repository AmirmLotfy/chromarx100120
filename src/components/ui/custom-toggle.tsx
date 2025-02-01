import * as React from "react";
import * as SwitchPrimitives from "@radix-ui/react-switch";
import { cn } from "@/lib/utils";

const CustomToggle = React.forwardRef<
  React.ElementRef<typeof SwitchPrimitives.Root>,
  React.ComponentPropsWithoutRef<typeof SwitchPrimitives.Root>
>(({ className, ...props }, ref) => (
  <SwitchPrimitives.Root
    className={cn(
      "peer inline-flex h-[20px] w-[34px] shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-primary data-[state=unchecked]:bg-input",
      "md:h-[22px] md:w-[38px]",
      className
    )}
    {...props}
    ref={ref}
  >
    <SwitchPrimitives.Thumb
      className={cn(
        "pointer-events-none block h-[16px] w-[16px] rounded-full bg-background shadow-lg ring-0 transition-transform data-[state=checked]:translate-x-[16px] data-[state=unchecked]:translate-x-0",
        "md:h-[18px] md:w-[18px] md:data-[state=checked]:translate-x-[18px]"
      )}
    />
  </SwitchPrimitives.Root>
));

CustomToggle.displayName = SwitchPrimitives.Root.displayName;

export { CustomToggle };