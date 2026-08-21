import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // kokoro-js / @huggingface/transformers ship native Node bindings
  // (sharp, onnxruntime-node) that only matter server-side, and the client
  // bundle needs a couple of tweaks to load the ONNX/WASM runtime correctly.
  // See: https://github.com/hexgrad/kokoro/issues/41
  serverExternalPackages: ["sharp", "onnxruntime-node", "kokoro-js", "@huggingface/transformers"],
  webpack: (config, { isServer }) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      sharp$: false,
      "onnxruntime-node$": false,
    };
    config.experiments = { ...config.experiments, asyncWebAssembly: true };
    if (!isServer) {
      config.output.globalObject = "self";
    }
    return config;
  },
};

export default nextConfig;