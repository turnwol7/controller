import { memo } from "react";
import { Icon, useStyleConfig } from "@chakra-ui/react";
import { Props } from "../types";

export const GemSolidIcon = memo(
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
          d="M7.647 5.18a.753.753 0 0 1 .604-.307h7.5c.237 0 .462.113.603.307l3.5 4.75a.754.754 0 0 1-.047.95l-7.25 8a.755.755 0 0 1-.556.247.755.755 0 0 1-.557-.247l-7.25-8a.75.75 0 0 1-.047-.95l3.5-4.75Zm1.204 1.243a.25.25 0 0 0-.066.328l1.794 2.988-4.6.384a.251.251 0 0 0 0 .5l6 .5h.04l6-.5a.251.251 0 0 0 0-.5l-4.597-.38 1.794-2.988a.25.25 0 0 0-.065-.329.254.254 0 0 0-.335.032L12 9.505l-2.815-3.05a.254.254 0 0 0-.334-.032Z"
        />
      </Icon>
    );
  },
);
