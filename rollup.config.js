// rollup.config.js
import babel from 'rollup-plugin-babel';
import resolve from 'rollup-plugin-node-resolve';
import commonjs from 'rollup-plugin-commonjs';
import postcss from 'rollup-plugin-postcss';
import peerDepsExternal from 'rollup-plugin-peer-deps-external';

export default {
  input: './src/index.js',

  output: [
    {
      name: 'box-canvas',
      sourcemap: true,
      file: './dist/index.js',
      format: 'umd',
      globals: { react: 'React' },
    },
  ],

  watch: {
    exclude: 'node_modules/**'
  },

  plugins: [
    peerDepsExternal(),
    postcss({
      extract: false,
      modules: true,
      use: ['sass'],
    }),
    resolve(),
    babel({
      exclude: 'node_modules/**',
      presets: ['@babel/preset-env', '@babel/preset-react'],
      plugins: [
        "@babel/plugin-syntax-export-default-from",
        "@babel/plugin-proposal-class-properties"
      ]
    }),
    commonjs(),
  ],
  external: [
    'react',
    'react-dom'
  ],
};