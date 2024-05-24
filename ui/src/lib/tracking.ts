import mixpanel from 'mixpanel-browser';
import { patchCurrentUser } from '@/api/users.ts';

function getCookie(name: string): string | null {
  const nameEQ = name + '=';
  const ca = document.cookie.split(';');
  for (let i = 0; i < ca.length; i++) {
    let c = ca[i];
    while (c.charAt(0) === ' ') c = c.substring(1, c.length);
    if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
  }
  return null;
}

export const reportInitialTrackingData = async () => {
  // Read and parse the marketing_info cookie
  const marketingInfoCookie = getCookie('marketing_info');
  if (marketingInfoCookie) {
    try {
      const marketingInfo = JSON.parse(marketingInfoCookie);

      // Set Mixpanel properties from the marketing_info cookie
      if (marketingInfo.referrer) {
        mixpanel.register({ $referrer: marketingInfo.referrer });
        mixpanel.register({ $referring_domain: marketingInfo.referrer });
        mixpanel.register({ initial_referrer: marketingInfo.referrer });
        mixpanel.register({ initial_referring_domain: marketingInfo.referrer });
      }
      if (marketingInfo.params) {
        if (marketingInfo.params.utm_source) {
          mixpanel.register({ utm_source: marketingInfo.params.utm_source });
        }
        if (marketingInfo.params.utm_medium) {
          mixpanel.register({ utm_medium: marketingInfo.params.utm_medium });
        }
        if (marketingInfo.params.utm_campaign) {
          mixpanel.register({ utm_campaign: marketingInfo.params.utm_campaign });
        }
        if (marketingInfo.params.utm_term) {
          mixpanel.register({ utm_term: marketingInfo.params.utm_term });
        }
        if (marketingInfo.params.utm_content) {
          mixpanel.register({ utm_content: marketingInfo.params.utm_content });
        }
      }
    } catch (error) {
      console.error('Error parsing marketing_info cookie:', error);
    }
  }

  // Now capture all Mixpanel properties after setting new values
  const mixpanelData: any = {};

  const properties = [
    'initial_referrer',
    'initial_referring_domain',
    'utm_source',
    'utm_medium',
    'utm_campaign',
    'utm_term',
    'utm_content',
    '$os',
    '$browser',
    '$browser_version',
    '$device',
    '$current_url',
    '$referrer',
    '$referring_domain',
    '$screen_height',
    '$screen_width',
    '$viewport_height',
    '$viewport_width',
  ];

  properties.forEach((prop) => {
    mixpanelData[prop] = mixpanel.get_property(prop);
  });

  console.log('Mixpanel Data:', mixpanelData);

  await patchCurrentUser({
    initialTrackingData: mixpanelData,
  });
};
