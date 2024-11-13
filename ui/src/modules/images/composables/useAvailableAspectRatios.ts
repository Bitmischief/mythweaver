export function useAvailableAspectRatios() {
  const aspectRatios = [
    { value: '1024x1024', label: 'Square (1:1)' },
    { value: '1152x896', label: 'Landscape (9:7)' },
    { value: '1216x832', label: 'Landscape (11:7.5)' },
    { value: '1344x768', label: 'Landscape (7:4)' },
    { value: '1536x640', label: 'Landscape (12:5)' },
    { value: '640x1536', label: 'Portrait (5:12)' },
    { value: '768x1344', label: 'Portrait (4:7)' },
    { value: '832x1216', label: 'Portrait (7.5:11)' },
    { value: '896x1152', label: 'Portrait (7:9)' },
  ];

  const getWidthAndHeight = (aspectRatio: string): { width: number; height: number } => {
    const [width, height] = aspectRatio.split('x').map(Number);
    return { width, height };
  };

  return {
    aspectRatios,
    getWidthAndHeight,
  }
}