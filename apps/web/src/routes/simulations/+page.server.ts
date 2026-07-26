import { fail, redirect } from '@sveltejs/kit';
import { backendRequest } from '$lib/server/backend';
import type { Actions, PageServerLoad } from './$types';

type EventOption = {
  id: string;
  title: string;
  sequence: number;
  chapter: { number: number };
  cursor: { ordinal: number };
};

export const load: PageServerLoad = async ({ fetch, url, cookies }) => {
  const branchId = url.searchParams.get('branch');
  const spoilerCookie = cookies.get('userSpoilerLimit');
  const spoilerLimit = spoilerCookie ? Number.parseInt(spoilerCookie, 10) : undefined;
  const suffix = Number.isFinite(spoilerLimit) ? `?spoilerLimit=${spoilerLimit}` : '';

  try {
    const events = await backendRequest<EventOption[]>(fetch, `/world-state/events${suffix}`);
    if (!branchId) return { events, branch: null, scene: null, backendError: null };
    const [branch, scene] = await Promise.all([
      backendRequest<any>(fetch, `/simulations/${branchId}`),
      backendRequest<any>(fetch, `/simulations/${branchId}/map-scene`)
    ]);
    return { events, branch, scene, backendError: null };
  } catch (error) {
    return {
      events: [] as EventOption[],
      branch: null,
      scene: null,
      backendError: error instanceof Error ? error.message : 'Backend unavailable'
    };
  }
};

export const actions: Actions = {
  create: async ({ request, fetch }) => {
    const data = await request.formData();
    const parentEventId = String(data.get('parentEventId') || '');
    const mode = String(data.get('mode') || 'rule-compatible');
    if (!parentEventId) return fail(400, { message: 'Choose a canonical fork event.' });
    try {
      const branch = await backendRequest<{ id: string }>(fetch, '/simulations', {
        method: 'POST',
        body: JSON.stringify({ parentEventId, mode })
      });
      throw redirect(303, `/simulations?branch=${branch.id}`);
    } catch (error) {
      if (error && typeof error === 'object' && 'status' in error) throw error;
      return fail(502, { message: error instanceof Error ? error.message : 'Unable to create branch.' });
    }
  },

  activateBungee: async ({ request, fetch, url }) => {
    const data = await request.formData();
    const branchId = String(data.get('branchId') || url.searchParams.get('branch') || '');
    const actorId = String(data.get('actorId') || 'hisoka');
    const targetId = String(data.get('targetId') || '');
    if (!branchId || !targetId) return fail(400, { message: 'A branch and target are required.' });
    try {
      await backendRequest(fetch, `/simulations/${branchId}/actions`, {
        method: 'POST',
        body: JSON.stringify({
          actionType: 'ACTIVATE_ABILITY',
          payload: {
            abilityId: 'bungee-gum',
            actorId,
            interaction: 'attach',
            actionId: 'attach',
            targets: [targetId]
          }
        })
      });
      throw redirect(303, `/simulations?branch=${branchId}`);
    } catch (error) {
      if (error && typeof error === 'object' && 'status' in error) throw error;
      return fail(502, { message: error instanceof Error ? error.message : 'Ability activation failed.' });
    }
  }
};
