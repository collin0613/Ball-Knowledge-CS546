import { updateUserMMR } from '../data/users.js';

function adjustMMR(username, wager, odds, result, oldMMR){
    newMMR = oldMMR;    
    if (odds < 0) {
        if (result === 'win') {
            newMMR += wager * (100 / Math.abs(odds));
        }
        else if (result === 'loss') {
            newMMR -= wager * (100 / Math.abs(odds));
        }
    } else {
        if (result === 'win') {
            newMMR += wager * (odds / 100);
        } else if (result === 'loss') {
            newMMR -= wager * (odds / 100);
        } 
    }
    updateUserMMR(username, newMMR);
} 