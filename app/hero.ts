// hero.ts
import { heroui } from "@heroui/react";
import { heroUiThemes } from "./theme/herouiThemes";

export default heroui({
  themes: {
    ...heroUiThemes,
  },
});