// to run: bun build.ts
// and run the file: ./build/{file_name}

await Bun.build({
  entrypoints: ['src/index.ts'],
  outdir: './build',
  // sourcemap: true,
  target: 'bun',
  minify: {
    whitespace: true,
    syntax: true,
  },
  // to compile to JS, remove the compile property below
  compile: {
    target: 'bun-linux-x64', // My Omarchy Linux and Docker x64 machine
    outfile: 'server',
  },
})

export {}
