const MiniCssExtractPlugin = require('mini-css-extract-plugin');

/** @type {import('next').NextConfig} */
const nextConfig = {
    eslint: {
        ignoreDuringBuilds: true,
    },
    typescript: {
        ignoreBuildErrors: true,
    },
    images: {
        unoptimized: true,
    },
    experimental: {
        webpackBuildWorker: true,
        parallelServerBuildTraces: true,
        parallelServerCompiles: true,
    },
    webpack: (config, { isServer }) => {
        // Chỉ áp dụng cho client-side bundles
        if (!isServer) {
            // Tìm rule cho CSS
            const cssRule = config.module.rules.find(rule =>
                rule.test && rule.test.toString().includes('css')
            );

            if (cssRule) {
                // Đảm bảo loader sử dụng mini-css-extract-plugin
                cssRule.use = [
                    MiniCssExtractPlugin.loader,
                    'css-loader',
                    'postcss-loader'
                ];
            }

            // Thêm plugin vào danh sách plugins
            config.plugins.push(
                new MiniCssExtractPlugin({
                    filename: 'static/css/[name].[contenthash:8].css',
                    chunkFilename: 'static/css/[name].[contenthash:8].chunk.css',
                })
            );
        }

        return config;
    },
};

module.exports = nextConfig; 