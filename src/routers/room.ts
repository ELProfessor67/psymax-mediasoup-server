import express,{Request,Response} from 'express'

const router = express.Router();

function generateRandomString() {
    const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  
    // Function to generate a random part with specified length
    function getRandomPart(length: number) {
      let result = '';
      for (let i = 0; i < length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      return result;
    }
  
    const part1 = 'u' + getRandomPart(2);  
    const part2 = getRandomPart(3);        
    const part3 = getRandomPart(3); 
  
    return `${part1}-${part2}-${part3}`;
}

router.get('/api/v1/create-room-id',(req:Request,res:Response) => {
    try {
        const id = generateRandomString();
        res.status(500).json({
            success: false,
            id
        })
    } catch (error) {
        res.status(500).json({
            success: false,
            message: (error as Error).message
        })
    }
})

export default router