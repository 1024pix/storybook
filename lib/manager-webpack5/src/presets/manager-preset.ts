import path, { dirname, join } from 'path';
import { DefinePlugin, ProvidePlugin } from 'webpack';
import type { Configuration } from 'webpack';
import HtmlWebpackPlugin from 'html-webpack-plugin';
// @ts-ignore // -- this has typings for webpack4 in it, won't work
import CaseSensitivePathsPlugin from 'case-sensitive-paths-webpack-plugin';
import VirtualModulePlugin from 'webpack-virtual-modules';
import TerserWebpackPlugin from 'terser-webpack-plugin';

import uiPaths from '@storybook/ui/paths';

import readPackage from 'read-pkg-up';
import type { PresetProperty, Options } from '@storybook/core-common';
import {
  loadManagerOrAddonsFile,
  resolvePathInStorybookCache,
  stringifyProcessEnvs,
} from '@storybook/core-common';

import type { StorybookConfig } from '@storybook/core-webpack';
import { customManagerRuntimeLoader } from '../utils/custom-manager-runtime-loader';
import { getManagerHeadTemplate, getManagerMainTemplate, readTemplate } from '../utils/template';
import { ManagerWebpackOptions } from '../utils/types';

export const managerMainTemplate: PresetProperty<
  'managerMainTemplate',
  StorybookConfig & { managerMainTemplate: string }
> = async () => getManagerMainTemplate();

export const managerHead: PresetProperty<'managerHead', StorybookConfig & { managerHead: string }> =
  async (_, { configDir }) => getManagerHeadTemplate(configDir, process.env);

export const staticDirs: PresetProperty<'staticDirs', StorybookConfig> = [
  {
    from: join(dirname(require.resolve('@storybook/manager-webpack5/package.json')), 'prebuilt'),
    to: '',
  },
];

export async function managerWebpack(
  _: Configuration,
  {
    configDir,
    configType,
    docsMode,
    entries,
    refs,
    outputDir,
    previewUrl,
    versionCheck,
    releaseNotesData,
    presets,
    features,
    serverChannelUrl,
  }: Options & ManagerWebpackOptions
): Promise<Configuration> {
  const envs = await presets.apply<Record<string, string>>('env');
  const logLevel = await presets.apply('logLevel', undefined);

  const [managerMainTemplate, managerHeadTemplate, refsTemplate] = await Promise.all<
    Promise<string>[]
  >([
    presets.apply('managerMainTemplate'),
    presets.apply('managerHead'),
    readTemplate('virtualModuleRef.template.js'),
  ]);

  const isProd = configType === 'PRODUCTION';
  const {
    packageJson: { version },
  } = await readPackage({ cwd: __dirname });

  return {
    name: 'manager',
    mode: isProd ? 'production' : 'development',
    bail: isProd,
    devtool: false,
    entry: entries,
    output: {
      path: outputDir,
      filename: isProd ? '[name].[contenthash].manager.bundle.js' : '[name].manager.bundle.js',
      publicPath: '',
      ..._.output,
    },
    watchOptions: {
      ignored: /node_modules/,
    },
    plugins: [
      refs
        ? new VirtualModulePlugin({
            [path.resolve(path.join(configDir, `generated-refs.js`))]: refsTemplate.replace(
              `'{{refs}}'`,
              JSON.stringify(refs)
            ),
          })
        : null,
      new HtmlWebpackPlugin({
        filename: `index.html`,
        // FIXME: `none` isn't a known option
        chunksSortMode: 'none' as any,
        alwaysWriteToDisk: true,
        inject: false,
        template: managerMainTemplate,
        templateParameters: {
          version,
          globals: {
            CONFIG_TYPE: configType,
            LOGLEVEL: logLevel,
            FEATURES: features,
            VERSIONCHECK: JSON.stringify(versionCheck),
            RELEASE_NOTES_DATA: JSON.stringify(releaseNotesData),
            DOCS_MODE: docsMode, // global docs mode
            PREVIEW_URL: previewUrl, // global preview URL
            SERVER_CHANNEL_URL: serverChannelUrl,
          },
          managerHeadTemplate,
        },
      }),
      new CaseSensitivePathsPlugin(),
      // graphql sources check process variable
      new DefinePlugin({
        ...stringifyProcessEnvs(envs),
        NODE_ENV: JSON.stringify(envs.NODE_ENV),
      }),
      new ProvidePlugin({ process: require.resolve('process/browser.js') }),
      // isProd &&
      //   BundleAnalyzerPlugin &&
      //   new BundleAnalyzerPlugin({ analyzerMode: 'static', openAnalyzer: false }),
    ].filter(Boolean),
    module: {
      rules: [
        customManagerRuntimeLoader(),
        {
          test: /\.css$/,
          use: [
            require.resolve('style-loader'),
            {
              loader: require.resolve('css-loader'),
              options: {
                importLoaders: 1,
              },
            },
          ],
        },
        {
          test: /\.(svg|ico|jpg|jpeg|png|apng|gif|eot|otf|webp|ttf|woff|woff2|cur|ani|pdf)(\?.*)?$/,
          type: 'asset/resource',
          generator: {
            filename: isProd
              ? 'static/media/[name].[contenthash:8][ext]'
              : 'static/media/[path][name][ext]',
          },
        },
        {
          test: /\.(mp4|webm|wav|mp3|m4a|aac|oga)(\?.*)?$/,
          type: 'asset',
          parser: {
            dataUrlCondition: {
              maxSize: 10000,
            },
          },
          generator: {
            filename: isProd
              ? 'static/media/[name].[contenthash:8][ext]'
              : 'static/media/[path][name][ext]',
          },
        },
      ],
    },
    resolve: {
      extensions: ['.mjs', '.js', '.jsx', '.json', '.cjs', '.ts', '.tsx'],
      modules: ['node_modules'].concat(envs.NODE_PATH || []),
      mainFields: ['browser', 'module', 'main'].filter(Boolean),
      alias: uiPaths,
    },
    recordsPath: resolvePathInStorybookCache('public/records.json'),
    performance: {
      hints: false,
    },
    optimization: {
      splitChunks: {
        chunks: 'all',
      },
      runtimeChunk: true,
      sideEffects: true,
      usedExports: true,
      concatenateModules: true,
      minimizer: isProd
        ? [
            new TerserWebpackPlugin({
              parallel: true,
              terserOptions: {
                mangle: false,
                sourceMap: true,
                keep_fnames: true,
              },
            }),
          ]
        : [],
    },
  };
}

export async function managerEntries(
  installedAddons: string[],
  options: { managerEntry: string; configDir: string }
): Promise<string[]> {
  const { managerEntry } = options;
  const entries = [];

  if (installedAddons && installedAddons.length) {
    entries.push(...installedAddons);
  }

  const managerConfig = loadManagerOrAddonsFile(options);
  if (managerConfig) {
    entries.push(managerConfig);
  }

  // entries.push(require.resolve(managerEntry));
  return entries;
}
