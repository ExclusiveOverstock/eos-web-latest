import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    // Three.js and React Three Fiber are fundamentally imperative — every
    // frame mutates camera/mesh/object properties in place (that's how the
    // renderer works), and shared input buffers between touch handlers and
    // the per-frame movement loop are deliberately non-reactive by design
    // (see lib/three/input-state.ts) to avoid a re-render per touch event.
    // These React-Compiler-readiness rules assume a render-driven,
    // immutable-props model that doesn't fit this layer, so they're scoped
    // off here rather than fought line-by-line across the 3D code.
    // Prototype B's experience layer is included for the same reasons: it
    // owns the shared interaction buffer that its scroll handler, its
    // pointer handlers and the render loop all write to, and routing those
    // through state would mean a re-render per scroll and pointer event —
    // competing for the very frames the camera move needs.
    files: [
      "src/components/three/**/*.tsx",
      "src/lib/three/**/*.ts",
      "src/components/prototype-b/**/*.tsx",
      "src/lib/prototype-b/**/*.ts",
    ],
    rules: {
      "react-hooks/immutability": "off",
      "react-hooks/refs": "off",
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;
