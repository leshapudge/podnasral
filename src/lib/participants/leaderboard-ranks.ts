/** Стандартное ранжирование: 1, 1, 3 при равных очках. */
export function assignCompetitionRanks<T extends { totalPoints: number }>(
  sortedEntries: T[],
): (T & { rank: number })[] {
  let rank = 0;
  let prevPoints: number | undefined;

  return sortedEntries.map((entry, index) => {
    if (index === 0 || entry.totalPoints !== prevPoints) {
      rank = index + 1;
    }
    prevPoints = entry.totalPoints;
    return { ...entry, rank };
  });
}
