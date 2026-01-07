import * as React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { Svg, Rect } from 'react-native-svg';
import dayjs from 'dayjs';
import db from '../database/db';
import { translations, SupportedLanguage } from '../utils/translations';
import { useLanguageStore } from '../store/useLanguageStore';

const { width } = Dimensions.get('window');
const CELL_SIZE = 10;
const CELL_GAP = 2;

export default function HeatmapCalendar() {
  const language = useLanguageStore(state => state.language);
  const t = translations[language as SupportedLanguage];
  const MONTH_LABELS = [
    t.jan,
    t.feb,
    t.mar,
    t.apr,
    t.may,
    t.jun,
    t.jul,
    t.aug,
    t.sep,
    t.oct,
    t.nov,
    t.dec,
  ];
  const DAY_LABELS = [t.sun, t.mon, t.tue, t.wed, t.thu, t.fri, t.sat];
  // Get all completion counts per day (last 365 days)
  const endDate = dayjs();
  const startDate = endDate.subtract(365, 'day');

  const counts = db.getAllSync(
    `
    SELECT date, COUNT(*) as count 
    FROM completions 
    WHERE date >= ? AND date <= ?
    GROUP BY date
  `,
    [startDate.startOf('day').valueOf(), endDate.endOf('day').valueOf()],
  ) as { date: number; count: number }[];

  const countMap = new Map<number, number>();
  counts.forEach(c => countMap.set(c.date, c.count));

  // Generate cells
  const cells = [];
  let current = startDate.startOf('week');
  const totalCells = 53 * 7; // ~1 year

  for (let i = 0; i < totalCells; i++) {
    const day = current.valueOf();
    const count = countMap.get(day) || 0;
    const intensity =
      count === 0
        ? '#ebedf0'
        : count === 1
        ? '#9be9a8'
        : count === 2
        ? '#40c463'
        : count === 3
        ? '#30a14e'
        : '#216e39';

    cells.push(
      <React.Fragment key={i}>
        <Rect
          x={(i % 53) * (CELL_SIZE + CELL_GAP)}
          y={Math.floor(i / 53) * (CELL_SIZE + CELL_GAP)}
          width={CELL_SIZE}
          height={CELL_SIZE}
          fill={intensity}
          rx={2}
        />
      </React.Fragment>,
    );

    current = current.add(1, 'day');
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{t.yearlyHeatmap || 'Yearly Heatmap'}</Text>
      <Svg
        width={width - 40}
        height={140}
        viewBox={`0 0 ${53 * (CELL_SIZE + CELL_GAP)} ${7 * (CELL_SIZE + CELL_GAP)}`}
      >
        {cells}
      </Svg>
      <View style={styles.legend}>
        <Text>{t.less || 'Less'}</Text>
        {[0, 1, 2, 3, 4].map(n => (
          <View
            key={n}
            style={[
              styles.legendBox,
              {
                backgroundColor:
                  n === 0
                    ? '#ebedf0'
                    : n === 1
                    ? '#9be9a8'
                    : n === 2
                    ? '#40c463'
                    : n === 3
                    ? '#30a14e'
                    : '#216e39',
              },
            ]}
          />
        ))}
        <Text>{t.more || 'More'}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginVertical: 30, alignItems: 'center' },
  title: { fontSize: 20, fontWeight: '600', marginBottom: 16 },
  legend: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 16 },
  legendBox: { width: 16, height: 16, borderRadius: 4 },
});
