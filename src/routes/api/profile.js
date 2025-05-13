import {Router} from 'express';
const router = Router();
import { getProfileEditorState, saveProfileEditorState } from '../../data/users.js';
import xss from 'xss';
//safe from xss
router.route('/:username').get(async (req, res) => {
    try {
        const username = req.params.username;
        
        const user = await getUserByUsername(username);
        
        if (!user) {
          return res.status(404).json({ error: 'User not found' });
        }
        
        return res.json({
          username: user.username,
          rank: user.rank,
          mmr: user.mmr,
          bio: user.bio || '',
          friends: user.friends || [],
          creditBalance: user.creditBalance,
          pickHistory: user.pickHistory || []
        });
      } catch (e) {
        console.error(e);
        return res.status(500).json({ error: e.toString() });
      }
});

function sanitizeObject(obj){
  if (typeof obj === 'string'){
    return xss(obj);
  }else if(Array.isArray(obj)){
    return obj.map(sanitizeObject);
  }else if(typeof obj === 'object' && obj !== null){
    const sanitized = {};
    for(const key in obj){
      sanitized[key] = sanitizeObject(obj[key]);
    }
    return sanitized;
  }
  return obj;
}

//adding xss prevention to req.body of post route
router.route('/save-state').post(async (req, res) => {
    try {
        if(!req.session.user) {
            return res.status(401).json({error: 'User not logged in'});
        }

        console.log('Session:', req.session);   

        const username = req.session.user.username;
        const rawEditorState = req.body || {};
        //performing xss prevention on editorState object
        const editorState = sanitizeObject(rawEditorState);

        if (!editorState || typeof editorState !== 'object') {
            return res.status(400).json({ error: 'Invalid editor state' });
        }
        console.log('Editor state:', editorState);
        await saveProfileEditorState(username, editorState);
        console.log('Editor state saved:', editorState);
        return res.json({ success: true });
    } catch (e) {
        console.error(e);
        return res.status(500).json({ error: e.toString() });
    }
});

router.route('/get-state/:username').get(async (req, res) => {
    try {
      const username = req.params.username;
      
      const editorState = await getProfileEditorState(username);
      
      return res.json(editorState);
    } catch (e) {
      console.error(e);
      return res.status(500).json({ error: e.toString() });
    }
  });

export default router;
