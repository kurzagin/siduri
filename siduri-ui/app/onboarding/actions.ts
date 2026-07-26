'use server';

import { db } from '@/db';
import { profiles, siduriConfig, projects, games, gameAccounts, accountStates } from '@/db/schema';
import { eq } from 'drizzle-orm';

const USER_ID = '11111111-1111-1111-1111-111111111111';

export async function saveOnboardingData(payload: any) {
  if (!db) throw new Error("Database not configured");

  try {
    // 1. Save Profile
    await db.insert(profiles).values({
      userId: USER_ID,
      displayName: payload.profile.displayName,
      timezone: payload.profile.timezone,
      preferences: { 
        language: payload.profile.language,
        realName: payload.profile.realName,
        nickname: payload.profile.nickname
      },
      boundaries: { streamRules: payload.streamRules }
    }).onConflictDoUpdate({
      target: profiles.userId,
      set: {
        displayName: payload.profile.displayName,
        timezone: payload.profile.timezone,
        preferences: { 
          language: payload.profile.language,
          realName: payload.profile.realName,
          nickname: payload.profile.nickname
        },
        boundaries: { streamRules: payload.streamRules }
      }
    });

    // 2. Save Siduri Config
    await db.insert(siduriConfig).values({
      userId: USER_ID,
      identity: payload.siduri.coreSentence || 'Siduri',
      personality: { derivedScenarios: payload.siduri.scenarios },
      speakingRules: {},
      humorRules: {},
      boundaries: {},
      voiceConfig: {},
    }).onConflictDoUpdate({
      target: siduriConfig.userId,
      set: {
        identity: payload.siduri.coreSentence || 'Siduri',
        personality: { derivedScenarios: payload.siduri.scenarios }
      }
    });

    // 3. Save Projects (clear existing for this user, then insert)
    await db.delete(projects).where(eq(projects.userId, USER_ID));
    if (payload.projects.length > 0) {
      const projectInserts = payload.projects.map((p: any) => ({
        userId: USER_ID,
        name: p.name,
        summary: p.summary,
        status: p.status,
        currentPriorities: p.priorities || []
      }));
      await db.insert(projects).values(projectInserts);
    }

    // 4. Save Games & Game Accounts
    await db.delete(games).where(eq(games.userId, USER_ID)); // Cascade will delete accounts and states
    if (payload.games.length > 0) {
      for (const gamePayload of payload.games) {
        // Insert Game
        const [gameRecord] = await db.insert(games).values({
          userId: USER_ID,
          name: gamePayload.name,
          gameData: {}
        }).returning({ id: games.id });

        // Insert Game Account
        const [accountRecord] = await db.insert(gameAccounts).values({
          userId: USER_ID,
          gameId: gameRecord.id,
          label: 'Main',
          server: gamePayload.server,
          externalUid: gamePayload.uid
        }).returning({ id: gameAccounts.id });

        // Insert Initial Account State
        await db.insert(accountStates).values({
          userId: USER_ID,
          gameAccountId: accountRecord.id,
          state: {
            currency: gamePayload.currency,
            pity: gamePayload.pity,
            reserve: gamePayload.reserve
          },
          source: 'manual',
          isCurrent: true
        });
      }
    }

    return { success: true };
  } catch (error: any) {
    console.error("Onboarding Save Error:", error);
    return { success: false, error: error.message };
  }
}
