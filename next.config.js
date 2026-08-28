/** @type {import('next').NextConfig} */
const webpack = require("webpack");

const nextConfig = {
  output: "export",
  images: { unoptimized: true },
  trailingSlash: false,
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback.fs = false;
      config.resolve.fallback.tls = false;
      config.resolve.fallback.net = false;
      config.resolve.fallback.child_process = false;
    }

    config.plugins.push(
      new webpack.NormalModuleReplacementPlugin(/^node:/, (resource) => {
        resource.request = resource.request.replace(/^node:/, "");
      })
    );

    // Ensure 'url' is resolved correctly
    config.resolve.fallback = {
      ...config.resolve.fallback,
      url: require.resolve("url"),
    };

    // Handle CommonJS modules
    config.module = {
      ...config.module,
      rules: [
        ...config.module.rules,
        {
          // Process CommonJS modules
          test: /\.m?js/,
          resolve: {
            fullySpecified: false,
          },
        },
      ],
    };
    return config;
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
};

module.exports = nextConfig;
