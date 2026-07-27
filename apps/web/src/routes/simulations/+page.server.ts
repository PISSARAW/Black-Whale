import { fail, redirect } from '@sveltejs/kit';
import { listCanonicalEvents } from '@black-whale/timeline-engine';
import {
  SimulationInputError,
  SimulationNotFoundError,
  parseCreateSimulationInput,
  parseSimulationActionInput
} from '@black-whale/simulation-engine';
import { prisma } from '$lib/server/db';
import { simulationStore } from '$lib/server/simulations';
import { rateLimit } from '$lib/server/rateLimit';
import type { Actions, PageServerLoad } from './$types';

// Both actions persist rows for an anonymous visitor, so they carry their own
// per-address budget: branch creation is the expensive one, individual actions
// within an existing branch are cheaper.
const CREATE_LIMIT = 10;
const ACTION_LIMIT = 30;
const RATE_WINDOW_MS = 60_000;

/**
 * Only errors this code raised deliberately are safe to show. Anything else
 * (Prisma failures, connection strings in stack messages) is logged for the
 * operator and replaced with the caller-supplied fallback.
 */
function message(error: unknown, fallback: string): string {
  if (error instanceof SimulationInputError || error instanceof SimulationNotFoundError) return error.message;
  console.error('[simulations]', error);
  return fallback;
}

export const load: PageServerLoad = async ({ url, cookies }) => {
  const spoilerCookie = cookies.get('userSpoilerLimit');
  const parsedLimit = spoilerCookie ? Number.parseInt(spoilerCookie, 10) : undefined;
  const events = await listCanonicalEvents(prisma, Number.isFinite(parsedLimit) ? parsedLimit : undefined);

  const branchId = url.searchParams.get('branch');
  if (!branchId) return { events, branch: null, scene: null, branchError: null };

  try {
    const [branch, scene] = await Promise.all([
      simulationStore.getBranchState(branchId),
      simulationStore.getMapScene(branchId, 'black-whale-overview')
    ]);
    return { events, branch, scene, branchError: null };
  } catch (error) {
    return { events, branch: null, scene: null, branchError: message(error, 'Unable to load this branch.') };
  }
};

export const actions: Actions = {
  create: async ({ request, getClientAddress }) => {
    const throttle = rateLimit(`sim:create:${getClientAddress()}`, CREATE_LIMIT, RATE_WINDOW_MS);
    if (!throttle.allowed) {
      return fail(429, {
        message: `Too many branches created. Try again in ${throttle.retryAfterSeconds}s.`
      });
    }

    const data = await request.formData();
    let branchId: string;
    try {
      const branch = await simulationStore.createBranch(
        parseCreateSimulationInput({
          parentEventId: data.get('parentEventId'),
          mode: data.get('mode') ?? 'rule-compatible'
        })
      );
      branchId = branch.id;
    } catch (error) {
      return fail(400, { message: message(error, 'Unable to create branch.') });
    }
    throw redirect(303, `/simulations?branch=${branchId}`);
  },

  activateBungee: async ({ request, url, getClientAddress }) => {
    const throttle = rateLimit(`sim:action:${getClientAddress()}`, ACTION_LIMIT, RATE_WINDOW_MS);
    if (!throttle.allowed) {
      return fail(429, {
        message: `Too many simulation actions. Try again in ${throttle.retryAfterSeconds}s.`
      });
    }

    const data = await request.formData();
    const branchId = String(data.get('branchId') || url.searchParams.get('branch') || '');
    const targetId = String(data.get('targetId') || '');
    if (!branchId || !targetId) return fail(400, { message: 'A branch and target are required.' });

    try {
      await simulationStore.applyAction(
        branchId,
        parseSimulationActionInput({
          actionType: 'ACTIVATE_ABILITY',
          payload: {
            abilityId: 'bungee-gum',
            actorId: String(data.get('actorId') || 'hisoka'),
            interaction: 'attach',
            actionId: 'attach',
            targets: [targetId]
          }
        })
      );
    } catch (error) {
      return fail(400, { message: message(error, 'Ability activation failed.') });
    }
    throw redirect(303, `/simulations?branch=${branchId}`);
  }
};
