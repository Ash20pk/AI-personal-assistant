/** @type {import('next').NextConfig} */
const nextConfig = {
    webpack: (config, { isServer }) => {
      config.module.rules.push({
        test: /\.(ogg|mp3|wav|mpe?g)$/i,
        type: 'asset/resource',
        generator: {
          filename: 'static/media/[name].[hash][ext]'
        }
      });
  
      if (!isServer) {
        config.resolve.fallback = {
          ...config.resolve.fallback,
          "child_process": false,
          "fs": false,
        };
      }
  
      return config;
    },
    images: {
      remotePatterns: [
        {
          protocol: 'https',
          hostname: 'metaschool.so',
          pathname: '/**',
        },
      ],
    },
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
        },
        {
          source: '/audioProcessor.js',
          headers: [
            {
              key: 'Content-Type',
              value: 'application/javascript'
            }
          ]
        }
      ];
    },
  };

export default nextConfig;
