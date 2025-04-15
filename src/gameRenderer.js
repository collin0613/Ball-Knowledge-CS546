document.addEventListener('DOMContentLoaded', function () { // is called when the page is loaded
    fetch('/gamelog')
        .then(response => response.json())
        .then(data => {
            document.getElementById('nhl-btn').addEventListener('click', () => displayLeague(data.NHL));
            document.getElementById('nba-btn').addEventListener('click', () => displayLeague(data.NBA));
            document.getElementById('mlb-btn').addEventListener('click', () => displayLeague(data.MLB));
        })
        .catch(error => {
            document.getElementById('container').innerHTML = `Error: ${error.message}`;
            console.error('Error:', error);
        });

    function displayLeague(games) {
        const container = document.getElementById('container');
        container.innerHTML = '';

        if (!games || games.length === 0) {
            container.innerHTML = 'No games available';
            return;
        }

        games.forEach(game => {
            const gameCard = document.createElement('div');
            gameCard.className = 'game-card';

            let statusClass = '';
            if (game.status === 'Final') {
                statusClass = 'final';
            } else if (game.status.includes('1st') || game.status.includes('2nd') ||
                game.status.includes('3rd') || game.status.includes('4th')) {
                statusClass = 'live';
            }

            let homeMl = 'N/A';
            let awayMl = 'N/A';
            let homeClass = '';
            let awayClass = '';

            if (game.home_money_line && typeof game.home_money_line === 'object') {
                if (game.home_money_line.draftkings !== undefined) {
                    homeMl = game.home_money_line.draftkings;
                } else if (Object.keys(game.home_money_line).length > 0) {
                    homeMl = game.home_money_line[Object.keys(game.home_money_line)[0]];
                }
                homeClass = parseInt(homeMl) > 0 ? 'positive' : 'negative';
            }

            if (game.away_money_line && typeof game.away_money_line === 'object') {
                if (game.away_money_line.draftkings !== undefined) {
                    awayMl = game.away_money_line.draftkings;
                } else if (Object.keys(game.away_money_line).length > 0) {
                    awayMl = game.away_money_line[Object.keys(game.away_money_line)[0]];
                }
                awayClass = parseInt(awayMl) > 0 ? 'positive' : 'negative';
            }

            gameCard.innerHTML = `
              <div>${game.away_team} ${game.away_score !== undefined ? game.away_score : '-'} @ 
              ${game.home_team} ${game.home_score !== undefined ? game.home_score : '-'}</div>
              <div><span class="${statusClass}">${game.status}</span></div>
              <div>Away ML: <span class="${awayClass}">${awayMl}</span> | 
                   Home ML: <span class="${homeClass}">${homeMl}</span></div>
            `;

            container.appendChild(gameCard);
        });
    }
});