export const filterTeamData = (data, team, unit) => {
  return data.filter(play => {
    if (unit === 'offense') return play.posteam === team;
    if (unit === 'defense') {
      return play.defteam === team && 
             play.play_type && 
             ['pass', 'run'].includes(play.play_type);
    }
    return false;
  });
};

export const prepareFeatures = (play, unit) => [
  play.down,
  play.ydstogo,
  play.yardline_100,
  play.score_differential,
  play.qtr,
  play.game_seconds_remaining,
  play.shotgun ? 1 : 0,
  play.no_huddle ? 1 : 0,
  unit === 'defense' ? (play.number_of_pass_rushers || 4) : 0,
  play.defenders_in_box || 6
];