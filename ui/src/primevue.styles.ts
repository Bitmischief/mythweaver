const PrimeVueStyles = {
  inputText: {
    root: 'border-zinc-800 bg-surface-2 rounded-lg text-sm w-full border-zinc-800',
  },
  textarea: {
    root: 'bg-surface-2 rounded-lg text-sm w-full border-zinc-800 active:ring-fuchsia-500 focus:ring-fuchsia-500 focus:border-fuchsia-500',
  },
  chip: {
    root: 'py-1 px-2 rounded-lg bg-surface-2 border border-surface-3 flex items-center gap-1 cursor-pointer',
  },
  select: {
    root: 'p-2 border border-zinc-800 bg-surface-2 rounded-lg text-sm w-full flex gap-2 justify-between items-center cursor-pointer',
    listContainer: {
      class: '!bg-surface-2 rounded-lg border border-zinc-800 overflow-y-auto',
    },
    option: {
      class: 'text-neutral-300 flex items-center gap-1 p-1 hover:bg-fuchsia-500/25 cursor-pointer',
    },
  },
  multiSelect: {
    root: 'p-2 border border-zinc-800 bg-surface-2 rounded-lg text-sm w-full flex justify-between items-center cursor-pointer',
    listContainer: {
      class: '!bg-surface-2 rounded-lg border border-zinc-800 overflow-y-auto',
    },
    option: {
      class: 'text-neutral-300 flex items-center gap-1 p-2 hover:bg-fuchsia-500/25 cursor-pointer',
    },
    pcsection: {
      class: 'flex flex-col gap-2',
    },
    header: {
      class: 'hidden',
    },
    pcoptioncheckbox: {
      root: 'hidden',
    },
    label: {
      class: 'flex gap-1 flex-wrap',
    },
  },
  selectButton: {
    root: 'p-2 border border-zinc-800 bg-surface-3 rounded-lg text-sm text-neutral-300 w-full flex justify-between items-center cursor-pointer',
    pctogglebutton: {
      root: 'data-[p-checked=true]:button-purple data-[p-checked=false]:button-primary flex-grow',
    },
  },
  button: {
    root: 'flex justify-center items-center gap-1 w-full',
  },
  slider: {
    root: 'cursor-pointer relative !bg-surface-2 h-4 mx-3 my-1 rounded-full',
    range: {
      class: '!bg-fuchsia-500/50 h-4 rounded-l-full',
    },
    handle: {
      class: '!bg-fuchsia-500 -ml-2 w-4 h-4 rounded-full',
    },
  },
  datePicker: {
    panel: {
      class: '!bg-surface-2 text-neutral-300 p-2 border border-fuchsia-500 rounded-lg mt-3',
    },
    yearview: {
      class: 'grid grid-cols-2',
    },
    year: {
      class: 'cursor-pointer text-center hover:bg-fuchsia-500/50 rounded-full py-1',
    },
    monthview: {
      class: 'grid grid-cols-3',
    },
    month: {
      class: 'cursor-pointer text-center hover:bg-fuchsia-500/50 rounded-full py-1',
    },
    decade: {
      class: 'whitespace-nowrap',
    },
    dayview: {
      class: 'w-full',
    },
    daycell: {
      class:
        'text-center data-[p-other-month=true]:text-neutral-600 data-[p-other-month=true]:pointer-events-none hover:bg-fuchsia-500/50 border-neutral-600 rounded-full border-rounded-full  data-[p-today=true]:border cursor-pointer py-2',
    },
    day: {
      class: 'text-center p-2',
    },
    selectmonth: {
      class: 'px-2 hover:bg-fuchsia-500/50 rounded-full cursor-pointer',
    },
    selectyear: {
      class: 'px-2 hover:bg-fuchsia-500/50 rounded-full cursor-pointer',
    },
    header: {
      class: 'flex p-2',
    },
    title: {
      class: 'flex',
    },
  },
  checkbox: {
    root: 'relative flex',
    option: {
      class: 'flex',
    },
    input: {
      class:
        'cursor-pointer appearance-none absolute inset-0 w-full h-full p-0 m-0 opacity-0 z-1 outline-none border border-transparent',
    },
    box: {
      class:
        'flex justify-center items-center rounded border border-zinc-800 bg-fuchsia-500 w-5 h-5 outline-transparent',
    },
  },
  splitbutton: {
    root: 'cursor-pointer bg-surface-2 flex justify-center items-center rounded-[12px]',
    pcdropdown: {
      root: 'bg-surface-2 hover:bg-neutral-900 p-1 pl-2 flex justify-center items-center rounded-[12px]',
    },
    pcmenu: {
      root: 'bg-surface-3 border border-neutral-500 text-neutral-400 rounded-md',
      item: {
        class: 'hover:cursor-pointer p-2 px-4 hover:bg-surface-2 rounded-md',
      },
    },
  },
  fileupload: {
    root: 'flex flex-wrap items-center justify-center gap-2',
    input: {
      class: 'hidden',
    },
  },
  dialog: {
    root: 'bg-neutral-900 border w-[30rem] border-zinc-800 rounded-lg text-neutral-300 p-4 shadow-lg flex',
    header: 'flex justify-between items-center text-2xl text-neutral-100 font-medium mb-4',
    footer: {
      class: 'flex justify-end gap-2 mt-4',
    },
    mask: {
      class: 'bg-neutral-900/50 backdrop-blur-sm',
    },
  },
  confirmdialog: {
    root: 'bg-neutral-900 border w-[30rem] border-zinc-800 rounded-lg text-neutral-300 p-4 shadow-lg flex',
    header: 'flex justify-between items-center text-2xl text-neutral-100 font-medium mb-4',
    footer: {
      class: 'flex justify-end gap-2 mt-4',
    },
    pcrejectbutton: {
      root: 'px-4 py-2 bg-neutral-900 hover:bg-neutral-800 border border-zinc-800 rounded-lg',
    },
    pcacceptbutton: {
      root: 'px-4 py-2 bg-fuchsia-500 hover:bg-fuchsia-600 text-white rounded-lg',
    },
  },
  panel: {
    root: 'bg-surface-2 border border-zinc-800 rounded-lg p-4 shadow-lg',
    header: 'flex items-center justify-between items-center text-lg text-neutral-100 font-medium',
  },
  dropdown: {
    root: 'bg-surface-2 flex gap-2 items-center justify-between border border-zinc-800 rounded-lg p-2 text-sm w-full',
  },
};

export default PrimeVueStyles;
