# JOSH IS A BOT

4/14/25
I changed a few things. I got rid of the oddsScrape directory since the changes that I made do not include any scraping. I added a new
file called sportsData.js inside the /data directory. this file has 2 data functions that make api calls with the Odds API (read the 
comments in the file for more info). I also changed up the routes to match the data functions. you have to use specific ids in order to get the odds data (such as icehockey_nhl for nhl). 
# TSports

`node app.js` Exposes api routes on port 3000

`npm run dev` Run the development server, serving the frontend on port 5173 (vite port)


---


# Development Log

- Express routes created for getting game data from backend
  - Backend oddsScrape/scrape.py fetches daily games  and lines for the entered "LEAGUE" ("NHL", "NBA", etc.)
  -
