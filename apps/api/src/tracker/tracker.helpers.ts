import { z } from 'zod';
import { trackerStatus, webLink } from '../events/assignment.helpers.js';

export const trackerUpdateInput = z.object({
  status: trackerStatus,
  links: z.array(webLink).max(20),
});
export type TrackerUpdateInput = z.infer<typeof trackerUpdateInput>;
