import ChartClip from "./ChartClip";
import UpdateChart from "./UpdateChart";
import { name, version } from "../package.json";

export default {
  npm_name: name,
  version: version,
  incidents: [
    {
      exportable: UpdateChart,
      name: "UpdateChart",
      attributesValidationRules: {
        animatedAttrs: {
          type: "object",
          strict: false,
        },
        attrs: {
          type: "object",
          strict: false,
          optional: true,
        },
      },
    },
  ],
  Clip: {
    exportable: ChartClip,
    attributesValidationRules: {
      option: {
        type: "object",
        optional: true,
        strict: false,
      },
    },
  },
};
