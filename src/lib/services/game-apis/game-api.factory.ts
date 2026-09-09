import { GameApiSearchResult } from './types';
import { searchEaFcProClub } from './eafc-api.service';
import { searchValorantTeamOrPlayer } from './valorant-api.service';
import { searchLeagueOfLegendsTeamOrPlayer } from './riot-lol-api.service';
import { searchCS2TeamOrPlayer } from './cs2-api.service';
import { searchRocketLeagueTeamOrPlayer } from './rocket-league-api.service';
import { searchFortniteTeamOrPlayer } from './fortnite-api.service';

/**
 * Fábrica unificada para enrutar extracciones automáticas según la disciplina eSports (gameSlug)
 */
export async function extractTeamDataFromGameApi(
  gameSlug: string,
  query: string,
  platform = 'CROSSPLAY'
): Promise<GameApiSearchResult> {
  const normalizedSlug = (gameSlug || 'eafc26').toLowerCase();

  switch (normalizedSlug) {
    case 'eafc26':
      return searchEaFcProClub(query, platform.toLowerCase().includes('ps4') ? 'gen4' : 'common-gen5');

    case 'valorant':
      return searchValorantTeamOrPlayer(query);

    case 'lol':
      return searchLeagueOfLegendsTeamOrPlayer(query);

    case 'csgo':
    case 'cs2':
      return searchCS2TeamOrPlayer(query);

    case 'rocketleague':
      return searchRocketLeagueTeamOrPlayer(query);

    case 'fortnite':
      return searchFortniteTeamOrPlayer(query);

    default:
      return searchEaFcProClub(query);
  }
}
