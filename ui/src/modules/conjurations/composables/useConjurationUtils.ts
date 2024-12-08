import { Conjuration } from '@/modules/conjurations/types';

export function useConjurationUtils(conjuration: Conjuration) {
  function getConjurationDescription() {
    return (
      conjuration?.data?.blocks?.find((b: any) => b.data?.label?.toLowerCase() === 'backstory')
        ?.data.text ||
      conjuration?.data?.blocks?.find((b: any) => b.data?.label?.toLowerCase() === 'description')
        ?.data.text ||
      conjuration?.data?.blocks?.find((b: any) => b.data?.label?.toLowerCase() === 'history')?.data
        .text ||
      conjuration?.data?.blocks?.find((b: any) => b.data?.label?.toLowerCase() === 'background')
        ?.data.text ||
      conjuration?.data?.blocks[0]?.data.text
    );
  }

  return {
    getConjurationDescription,
  };
}
