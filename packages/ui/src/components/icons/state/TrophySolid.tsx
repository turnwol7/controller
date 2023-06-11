import { memo } from "react";
import { Icon, useStyleConfig } from "@chakra-ui/react";
import { Props } from "../types";

export const TrophySolidIcon = memo(
  ({
    variant,
    size,
    boxSize = 6,
    colorScheme,
    orientation,
    styleConfig,
    ...iconProps
  }: Props) => {
    const styles = useStyleConfig("Icon", {
      variant,
      size,
      colorScheme,
      orientation,
      styleConfig,
    });

    return (
      <Icon viewBox="0 0 24 24" __css={styles} boxSize={boxSize} {...iconProps}>
        <path
          fill="currentColor"
          d="M20.385 6.876a.71.71 0 0 0-.69-.543h-2.976c.008-.367.003-.7-.004-.974a.937.937 0 0 0-.943-.915H8.228a.94.94 0 0 0-.944.915c-.033.275-.012.607-.003.974H4.305a.709.709 0 0 0-.69.543c-.024.1-.579 2.503.98 4.826 1.104 1.647 2.968 2.805 5.533 3.465.552.142 1.163.656 1.163 1.226v1.746h-2.36c-.391 0-.682.317-.682.708 0 .391.292.709.682.709h6.112c.391 0 .682-.318.682-.709 0-.39-.318-.708-.682-.708h-2.335V16.39c.001-.57.612-1.083 1.163-1.225 2.567-.66 4.43-1.816 5.534-3.465 1.558-2.322 1.004-4.725.98-4.825Zm-14.6 4.055C4.96 9.716 4.887 8.45 4.928 7.75H7.3c.158 1.76.6 3.87 1.702 5.581-1.448-.575-2.525-1.378-3.218-2.4Zm12.43 0c-.691 1.022-1.768 1.823-3.216 2.398 1.1-1.71 1.543-3.82 1.7-5.58h2.372c.015.7-.032 1.97-.855 3.183Z"
        />
      </Icon>
    );
  },
);
