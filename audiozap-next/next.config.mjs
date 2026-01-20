/** @type {import('next').NextConfig} */
const nextConfig = {
    output: 'standalone',
    reactStrictMode: true,
    eslint: {
        ignoreDuringBuilds: true,
    },
    typescript: {
        ignoreBuildErrors: true,
    },
    experimental: {
        turbo: {
            resolveAlias: {
                fs: false,
                net: false,
                tls: false,
            },
        },
    },
    webpack: (config, { isServer }) => {
        if (!isServer) {
            config.resolve.fallback = {
                ...config.resolve.fallback,
                fs: false,
                net: false,
                tls: false,
                crypto: false,
            };
        }
        return config;
    },
};

export default nextConfig;
