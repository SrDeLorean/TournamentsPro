import { describe, expect, it } from 'vitest';
import {
  calculateHybridPlayoffStructure,
  generatePlayoffBracket,
  generateHybridCrossSeedings,
} from '../src/lib/matchmaking-bracket';

describe('calculateHybridPlayoffStructure', () => {
  it('calculates 3 groups with 1 qualifier (3 -> 4, 1 Mejor 2°)', () => {
    const structure = calculateHybridPlayoffStructure(3, 1);
    expect(structure.directQualifiers).toBe(3);
    expect(structure.bracketSize).toBe(4);
    expect(structure.wildcardCount).toBe(1);
    expect(structure.wildcardRank).toBe(2);
    expect(structure.wildcardLabel).toBe('Mejor 2°');
    expect(structure.wildcardSeeds).toEqual(['Mejor 2°']);
    expect(structure.initialRoundName).toBe('Semifinales');
    expect(structure.seedPairs).toHaveLength(2);

    // Verify all 3 first places and 1 wildcard are paired
    const allSeeds = structure.seedPairs.flatMap((p) => [p.homeSeed, p.awaySeed]);
    expect(allSeeds).toContain('1° de Grupo A');
    expect(allSeeds).toContain('1° de Grupo B');
    expect(allSeeds).toContain('1° de Grupo C');
    expect(allSeeds).toContain('Mejor 2°');

    // No pair has both seeds identical
    structure.seedPairs.forEach((p) => {
      expect(p.homeSeed).not.toBe(p.awaySeed);
    });
  });

  it('calculates 3 groups with 2 qualifiers (6 -> 8, 2 Mejores 3°)', () => {
    const structure = calculateHybridPlayoffStructure(3, 2);
    expect(structure.directQualifiers).toBe(6);
    expect(structure.bracketSize).toBe(8);
    expect(structure.wildcardCount).toBe(2);
    expect(structure.wildcardRank).toBe(3);
    expect(structure.wildcardLabel).toBe('2 Mejores 3°');
    expect(structure.wildcardSeeds).toEqual(['1° Mejor 3°', '2° Mejor 3°']);
    expect(structure.initialRoundName).toBe('Cuartos de Final');
    expect(structure.seedPairs).toHaveLength(4);

    const allSeeds = structure.seedPairs.flatMap((p) => [p.homeSeed, p.awaySeed]);
    expect(allSeeds).toContain('1° de Grupo A');
    expect(allSeeds).toContain('2° de Grupo A');
    expect(allSeeds).toContain('1° Mejor 3°');
    expect(allSeeds).toContain('2° Mejor 3°');

    // Verify zero intra-group rematches in Cuartos
    structure.seedPairs.forEach((p) => {
      const matchHome = p.homeSeed.match(/Grupo\s+([A-Z])/i)?.[1];
      const matchAway = p.awaySeed.match(/Grupo\s+([A-Z])/i)?.[1];
      if (matchHome && matchAway) {
        expect(matchHome).not.toBe(matchAway);
      }
    });
  });

  it('calculates 5 groups with 1 qualifier (5 -> 8, 3 Mejores 2°)', () => {
    const structure = calculateHybridPlayoffStructure(5, 1);
    expect(structure.directQualifiers).toBe(5);
    expect(structure.bracketSize).toBe(8);
    expect(structure.wildcardCount).toBe(3);
    expect(structure.wildcardLabel).toBe('3 Mejores 2°');
    expect(structure.wildcardSeeds).toEqual(['1° Mejor 2°', '2° Mejor 2°', '3° Mejor 2°']);
    expect(structure.initialRoundName).toBe('Cuartos de Final');
    expect(structure.seedPairs).toHaveLength(4);
  });

  it('calculates 4 groups with 2 qualifiers (perfect 8, 0 wildcards)', () => {
    const structure = calculateHybridPlayoffStructure(4, 2);
    expect(structure.directQualifiers).toBe(8);
    expect(structure.bracketSize).toBe(8);
    expect(structure.wildcardCount).toBe(0);
    expect(structure.wildcardSeeds).toEqual([]);
    expect(structure.initialRoundName).toBe('Cuartos de Final');
    expect(structure.seedPairs).toHaveLength(4);
  });

  it('calculates 6 groups with 2 qualifiers (12 -> 16, 4 Mejores 3°)', () => {
    const structure = calculateHybridPlayoffStructure(6, 2);
    expect(structure.directQualifiers).toBe(12);
    expect(structure.bracketSize).toBe(16);
    expect(structure.wildcardCount).toBe(4);
    expect(structure.wildcardLabel).toBe('4 Mejores 3°');
    expect(structure.initialRoundName).toBe('Octavos de Final');
    expect(structure.seedPairs).toHaveLength(8);
  });

  it('calculates 2 groups with 1 qualifier (total 2 teams -> direct Final: 1° Grupo A vs 1° Grupo B)', () => {
    const structure = calculateHybridPlayoffStructure(2, 1);
    expect(structure.directQualifiers).toBe(2);
    expect(structure.bracketSize).toBe(2);
    expect(structure.wildcardCount).toBe(0);
    expect(structure.initialRoundName).toBe('Final');
    expect(structure.seedPairs).toHaveLength(1);
    expect(structure.seedPairs[0]).toEqual({
      homeSeed: '1° de Grupo A',
      awaySeed: '1° de Grupo B',
    });

    const nodes = generatePlayoffBracket('test-comp', [], 'PartidoUnico', true, 2, 1);
    expect(nodes).toHaveLength(1);
    expect(nodes[0].roundName).toBe('Final');
    expect(nodes[0].homeTeamName).toBe('1° de Grupo A');
    expect(nodes[0].awayTeamName).toBe('1° de Grupo B');
  });
});

describe('generatePlayoffBracket with hybrid wildcards', () => {
  it('generates full 4-team bracket for 3 groups with 1 qualifier', () => {
    const nodes = generatePlayoffBracket('test-comp', [], 'PartidoUnico', true, 3, 1);
    // 2 Semifinales + 1 Final = 3 matches
    expect(nodes).toHaveLength(3);

    const semis = nodes.filter((n) => n.roundName === 'Semifinales');
    expect(semis).toHaveLength(2);

    const finalMatch = nodes.find((n) => n.roundName === 'Final');
    expect(finalMatch).toBeDefined();

    // Opening round seed names contain the group winners and the wildcard
    const round1Names = semis.flatMap((s) => [s.homeTeamName, s.awayTeamName]);
    expect(round1Names).toContain('1° de Grupo A');
    expect(round1Names).toContain('Mejor 2°');
  });

  it('generates full 8-team bracket for 3 groups with 2 qualifiers', () => {
    const nodes = generatePlayoffBracket('test-comp', [], 'PartidoUnico', true, 3, 2);
    // 4 Cuartos + 2 Semis + 1 Final = 7 matches
    expect(nodes).toHaveLength(7);

    const quarters = nodes.filter((n) => n.roundName === 'Cuartos de Final');
    expect(quarters).toHaveLength(4);

    const quarterNames = quarters.flatMap((q) => [q.homeTeamName, q.awayTeamName]);
    expect(quarterNames).toContain('1° Mejor 3°');
    expect(quarterNames).toContain('2° Mejor 3°');
  });
});
