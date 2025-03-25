export const prepareData = (pbpData) => {
  // Filter meaningful plays
  const validPlays = pbpData.filter(play => 
    play.play_type && 
    !['no_play', 'note', 'qb_kneel'].includes(play.play_type) &&
    play.down && 
    play.ydstogo
  );

  // Get unique teams from the filtered data
  const uniqueTeams = [...new Set(validPlays.map(play => play.posteam))];

  const teamToInt = (team) => {
    return uniqueTeams.indexOf(team);
  };

  return {
    features: validPlays.map(play => ({
      down: play.down,
      ydstogo: play.ydstogo,
      yardline_100: play.yardline_100,
      score_differential: play.score_differential,
      quarter: play.qtr,
      game_seconds_remaining: play.game_seconds_remaining,
      wp: play.wp,
      shotgun: play.shotgun ? 1 : 0,
      no_huddle: play.no_huddle ? 1 : 0,
      defenders_in_box: play.defenders_in_box || 6,
      number_of_pass_rushers: play.number_of_pass_rushers || 4,
      posteam: teamToInt(play.posteam),
      defteam: teamToInt(play.defteam),
      is_redzone: play.yardline_100 <= 20 ? 1 : 0,
      is_goal_to_go: play.ydstogo >= play.yardline_100 ? 1 : 0
    })),
    labels: validPlays.map(play => play.play_type)
  };
};