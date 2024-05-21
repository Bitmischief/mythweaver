import mixpanel from 'mixpanel-browser';
import { patchCurrentUser } from '@/api/users.ts';

export const reportInitialTrackingData = async () => {
  const mixpanelData: any = {};

  // Capture all potentially valuable Mixpanel properties
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
