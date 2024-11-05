/** @type {import('next').NextConfig} */
const nextConfig = {
    webpack: (config, { isServer }) => {
      config.module.rules.push({
        test: /\.(ogg|mp3|wav|mpe?g)$/i,
        exclude: config.exclude,
        use: [
          {
            loader: 'url-loader',
            options: {
              limit: 8192,
              fallback: 'file-loader',
              publicPath: '/_next/static/sounds/',
              outputPath: `${isServer ? '../' : ''}static/sounds/`,
              name: '[name]-[hash].[ext]',
            },
          },
        ],
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
      domains: ['metaschool.so'],
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
        }
      ];
    },
  };

export default nextConfig;
