import { inflate } from 'pako';  // Use pako for browser decompression
import Papa from 'papaparse';

export async function loadNFLData() {
  try {
    // 1. Fetch compressed file
    const response = await fetch('/data/play_by_play_2024.csv.gz');
    if (!response.ok) throw new Error('Network response failed');

    // 2. Decompress with pako (browser-friendly)
    const compressed = await response.arrayBuffer();
    const decompressed = inflate(new Uint8Array(compressed));  // <-- pako's inflate

    // 3. Parse CSV with PapaParse
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
    if (unit === 'defense') return play.defteam === team;
    return ['punt', 'field_goal', 'kickoff'].includes(play.play_type);
  });
}