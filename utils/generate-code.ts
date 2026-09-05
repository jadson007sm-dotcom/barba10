const alphabet='ABCDEFGHJKLMNPQRSTUVWXYZ'
export function generateVerificationCode(){let n='';for(let i=0;i<5;i++)n+=Math.floor(Math.random()*10);return n+alphabet[Math.floor(Math.random()*alphabet.length)]}
export function normalizeWhatsApp(value:string){return value.replace(/\\D/g,'')}
