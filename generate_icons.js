const text2png = require('text2png');
const fs = require('fs');

async function generateIcons() {
    const sizes = [16, 48, 128];
    
    for (const size of sizes) {
        const png = text2png('/', {
            font: `${Math.floor(size * 0.7)}px Arial`,
            textColor: 'white',
            bgColor: '#4285f4',
            padding: 0,
            output: 'buffer',
            width: size,
            height: size
        });
        
        fs.writeFileSync(`icons/icon${size}.png`, png);
    }
}

generateIcons(); 