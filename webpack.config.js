const path = require("path");
const fs = require("fs");
const CopyWebpackPlugin = require("copy-webpack-plugin");

module.exports = {
    entry: "./src/queue-time-dashboard-widget.tsx",
    output: {
        filename: "queue-time-dashboard-widget.js"
    },
    optimization: {
        minimize: false
    },
    resolve: {
        extensions: [".ts", ".tsx", ".js"],
        alias: {
            "azure-devops-extension-sdk": path.resolve("node_modules/azure-devops-extension-sdk")
        },
    },
    stats: {
        warnings: false
    },
    module: {
        rules: [
            {
                test: /\.tsx?$/,
                loader: "ts-loader"
            },
            {
                test: /\.scss$/,
                use: [
                    "style-loader",
                    "css-loader",
                    "azure-devops-ui/buildScripts/css-variables-loader",
                    {
                        loader: require.resolve("sass-loader"),
                        options: {
                            sassOptions: {
                                // css-variables-loader will drop closing brackets and break with "unclosed block" if it replaces variables in compressed css
                                outputStyle: "expanded"
                            }
                        }
                    }
                ]
            },
            {
                test: /\.css$/,
                use: ["style-loader", "css-loader"],
            },
            {
                test: /\.woff$/,
                use: [{
                    loader: 'base64-inline-loader'
                }]
            },
            {
                test: /\.html$/,
                loader: "file-loader"
            }
        ]
    },
    plugins: [
        new CopyWebpackPlugin({
           patterns: [ 
               { from: "**/*.html", context: "src" }
           ]
        })
    ]
};