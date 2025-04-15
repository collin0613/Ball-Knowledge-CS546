import json
import sys
from sbrscrape import Scoreboard


if len(sys.argv) > 1:
    sport = sys.argv[1].upper()

games = Scoreboard(sport=sport).games
game_data = []

for game in games:
    game_info = {
        "home_team": game['home_team'],
        "away_team": game['away_team'],
        "date": game['date'],
        "status": game['status'],
        "home_score": game['home_score'],
        "away_score": game['away_score'],
        "home_money_line": game['home_ml'],
        "away_money_line": game['away_ml']
    }
    game_data.append(game_info)

print(json.dumps(game_data))

'''
with open('nhl_odds.json', 'w') as f:
    json.dump(game_data, f, indent=2)
    '''