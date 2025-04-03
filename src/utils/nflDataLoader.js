import { inflate } from 'pako';
import Papa from 'papaparse';

export async function loadNFLData() {
  try {
    const response = await fetch('/data/play_by_play_2024.csv.gz');
    if (!response.ok) throw new Error('Network response failed');

    const compressed = await response.arrayBuffer();
    const decompressed = inflate(new Uint8Array(compressed));

    const csvText = new TextDecoder().decode(decompressed);
    return new Promise((resolve) => {
      Papa.parse(csvText, {
        header: true,
        dynamicTyping: true,
        complete: (results) => {
          resolve(
            results.data.filter(play => 
              play.play_type && !['no_play', 'note'].includes(play.play_type)
            )
          );
        },
      });
    });
  } catch (error) {
    console.error("Data loading failed:", error);
    throw error;
  }
}

export function filterTeamData(data, team, unit) {
  return data.filter(play => {
    if (unit === 'offense') return play.posteam === team;
    if (unit === 'defense') {
      return play.defteam === team && 
             play.play_type && 
             ['pass', 'run'].includes(play.play_type);
    }
    return ['punt','field_goal','kickoff'].includes(play.play_type);
  });
}

// Yard line utilities
export function normalizeYardLine(yardLine) {
  return yardLine > 50 ? 100 - yardLine : yardLine;
}

export function getFieldSide(yardLine) {
  return yardLine > 50 ? 'Opponent' : 'Your';
}