export default {
  global: {
    fieldset: 'max-w-md border border-gray-400 rounded px-2 pb-1',
    help: 'text-xs text-gray-500',
    inner:
      'formkit-disabled:bg-gray-200 formkit-disabled:cursor-not-allowed formkit-disabled:pointer-events-none text-white overflow-hidden focus-within:border-blue-500 rounded-md formkit-invalid:border formkit-invalid:border-red-500',
    input:
      'appearance-none bg-transparent focus:outline-none focus:ring-0 focus:shadow-none gradient-border-no-opacity',
    label: 'block mb-1 font-bold text-sm',
    legend: 'font-bold text-sm',
    loaderIcon: 'inline-flex items-center w-4 text-gray-600 animate-spin',
    message: 'text-red-500 mb-1 text-xs',
    messages: 'list-none p-0 mt-1 mb-0',
    outer: 'mb-4 formkit-disabled:opacity-50',
    prefixIcon:
      'w-10 flex self-stretch grow-0 shrink-0 rounded-tl rounded-bl border-r border-gray-400 bg-white bg-gradient-to-b from-transparent to-gray-200 [&>svg]:w-full [&>svg]:max-w-[1em] [&>svg]:max-h-[1em] [&>svg]:m-auto',
    suffixIcon:
      'w-7 pr-3 p-3 flex self-stretch grow-0 shrink-0 [&>svg]:w-full [&>svg]:max-w-[1em] [&>svg]:max-h-[1em] [&>svg]:m-auto',
  },
  'family:button': {
    input:
      '$reset w-full md:w-auto md:ml-auto flex justify-center md:justify-start self-center rounded-md bg-gradient-to-r from-fuchsia-500 to-blue-400 px-4 py-3 transition-all hover:scale-110 formkit-disabled:bg-gray-400 formkit-loading:before:w-4 formkit-loading:before:h-4 formkit-loading:before:mr-2 formkit-loading:before:border formkit-loading:before:border-2 formkit-loading:before:border-r-transparent formkit-loading:before:rounded-3xl formkit-loading:before:border-white formkit-loading:before:animate-spin',
    wrapper: 'mb-1',
    prefixIcon: '$reset block w-4 -ml-2 mr-2 stretch',
    suffixIcon: '$reset block w-4 ml-2 stretch',
  },
  text: {
    outer: 'mb-5',
    label: 'block mb-1 font-bold text-sm',
    input: 'w-full rounded-md border bg-black px-4 text-left text-white',
    help: 'text-xs text-gray-500',
    messages: 'list-none p-0 mt-1 mb-0',
    message: 'text-red-500 mb-1 text-xs',
  },
  textarea: {
    inner: 'h-full',
    input: 'w-full h-full resize-none min-h-[6rem]',
  },
  select: {
    inner:
      'flex w-full relative max-w-md items-center rounded mb-1 [&>span:first-child]:focus-within:text-blue-500',
    input:
      'w-full pl-3 pr-8 py-2 formkit-multiple:p-0 data-[placeholder="true"]:text-gray-400 formkit-multiple:data-[placeholder="true"]:text-inherit',
    selectIcon:
      'flex p-[3px] shrink-0 w-5 mr-2 -ml-[1.5em] h-full pointer-events-none [&>svg]:w-[1em]',
    option: 'formkit-multiple:p-3 bg-surface-2 formkit-multiple:text-sm',
  },
  file: {
    fileItem: 'flex items-center mb-1 last:mb-0',
    fileItemIcon: 'w-4 mr-2 shrink-0',
    fileList: 'shrink grow peer px-3 py-2 formkit-multiple:data-[has-multiple="true"]:mb-6',
    fileName: 'break-all grow text-ellipsis',
    fileRemove:
      'relative z-[2] ml-auto text-[0px] hover:text-red-500 pl-2 peer-data-[has-multiple=true]:text-sm peer-data-[has-multiple=true]:text-blue-500 peer-data-[has-multiple=true]:ml-3 peer-data-[has-multiple=true]:mb-2 formkit-multiple:bottom-[0.15em] formkit-multiple:pl-0 formkit-multiple:ml-0 formkit-multiple:left-[1em] formkit-multiple:formkit-prefix-icon:left-[3.75em]',
    fileRemoveIcon: 'block text-base w-3 relative z-[2]',
    inner: 'relative max-w-md cursor-pointer formkit-multiple:[&>button]:absolute',
    input: 'cursor-pointer text-transparent absolute top-0 right-0 left-0 bottom-0 opacity-0 z-[2]',
    noFiles: 'flex w-full items-center px-3 py-2',
    noFilesIcon: 'w-4 mr-2',
  },
};
