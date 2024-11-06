/** @type {import('next').NextConfig} */
const nextConfig = {
    webpack: (config, { isServer }) => {
      // Audio file handling
      config.module.rules.push({
        test: /\.(mp3)$/i,
        type: 'asset/resource',
      });
  
      // Add fallbacks for client-side only
      if (!isServer) {
        config.resolve.fallback = {
          fs: false,
          net: false,
          tls: false,
          child_process: false,
        };
      }
  
      return config;
    },
    // Essential headers for AudioWorklet and SharedArrayBuffer
    async headers() {
      return [
        {
          source: '/:path*',
          headers: [
            {
              key: 'Cross-Origin-Opener-Policy',
              value: 'same-origin'
            },
            {
              key: 'Cross-Origin-Embedder-Policy',
              value: 'require-corp'
            }
          ]
        }
      ];
    }
  };

export default nextConfig;
