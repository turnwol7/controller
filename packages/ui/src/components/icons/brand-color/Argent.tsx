import { memo } from "react";
import { Icon, useStyleConfig } from "@chakra-ui/react";
import { Props } from "../types";

export const ArgentColorIcon = memo(
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
          fill="#FF875B"
          d="M14.31 4H9.674a.282.282 0 0 0-.28.288c-.092 4.488-2.369 8.753-6.28 11.774a.314.314 0 0 0-.066.408l2.713 3.866c.093.13.27.158.4.065 2.453-1.877 4.423-4.135 5.836-6.644 1.421 2.509 3.391 4.767 5.835 6.644.13.093.307.065.4-.065l2.713-3.866a.296.296 0 0 0-.065-.408c-3.921-3.02-6.188-7.276-6.281-11.774-.01-.158-.14-.288-.289-.288Z"
        />
      </Icon>
    );
  },
);
