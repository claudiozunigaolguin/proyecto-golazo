const BYE = '__BYE__';

export interface FixturePairing {
  round: number;
  homeTeamId: string;
  awayTeamId: string;
}

/**
 * Round-robin (circle method): cada equipo se enfrenta exactamente una vez
 * contra todos los demás, sin cruces duplicados, en N-1 fechas (N par) o
 * N fechas (N impar, con un descanso por fecha). Alterna localía por fecha
 * para repartir partidos de local/visita de forma balanceada.
 */
export function generateRoundRobinFixture(teamIds: string[]): FixturePairing[] {
  if (teamIds.length < 2) return [];

  const ids = [...teamIds];
  if (ids.length % 2 !== 0) ids.push(BYE);

  const n = ids.length;
  const totalRounds = n - 1;
  const half = n / 2;
  const arr = [...ids];
  const fixture: FixturePairing[] = [];

  for (let round = 0; round < totalRounds; round++) {
    const swap = round % 2 === 1;

    for (let i = 0; i < half; i++) {
      const a = arr[i];
      const b = arr[n - 1 - i];
      if (a === BYE || b === BYE) continue;

      fixture.push({
        round: round + 1,
        homeTeamId: swap ? b : a,
        awayTeamId: swap ? a : b,
      });
    }

    const last = arr[n - 1];
    for (let i = n - 1; i > 1; i--) {
      arr[i] = arr[i - 1];
    }
    arr[1] = last;
  }

  return fixture;
}
