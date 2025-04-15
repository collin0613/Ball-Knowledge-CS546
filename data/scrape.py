from dotenv import load_dotenv
import json
import sys
import requests
#using Odds API, I only get 500 requests a month for free trial so try not to make TOO many requests
#-Tristan




#loading the api key from hidden .env file 
load_dotenv()

API_KEY = os.getenv('ODDS_API_KEY')
SPORT = 'ice_hockey_nhl'
REGION = 'us'
MARKET = 'h2h'









#
# if len(sys.argv) > 1:
#     sport = sys.argv[1].upper()
#
# # games = Scoreboard(sport=sport).games
# scoreboard = Scoreboard(sport=sport)
# games = scoreboard.scrape_games()
# print(games)
# game_data = []
#
# for game in games:
#     game_info = {
#         "home_team": game['home_team'],
#         "away_team": game['away_team'],
#         "date": game['date'],
#         "status": game['status'],
#         "home_score": game['home_score'],
#         "away_score": game['away_score'],
#         "home_money_line": game['home_ml'],
#         "away_money_line": game['away_ml']
#     }
#     game_data.append(game_info)
# print(json.dumps(game_data))
#
# '''
# with open('nhl_odds.json', 'w') as f:
#     json.dump(game_data, f, indent=2)
#     '''
