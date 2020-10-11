import puppeteer from 'puppeteer'
import fs from 'fs'
import path from 'path'
import PDFDocument from 'pdfkit'

interface CodeQuestion {
    question: string;
    code: string;
}

const runCodes = async (page: puppeteer.Page) => {
    return new Promise(async(resolve, reject) => {
        try {
            console.log('🙂 Getting screenshots...')
            const readCodesList = fs.readFileSync(path.resolve(__dirname, 'utils/codes.json'))
            const codesList = JSON.parse(readCodesList.toString()) as [CodeQuestion];

            // first, load the prints
            for(let i = 0; i < codesList.length; i++){
                await insertAndRun(page, codesList[i].code, i)
                await page.reload()
            };

            await createPDF(codesList)

            resolve(true)
        } catch (e) {
            reject(e);
        }
    })
}

const createPDF = async (codesList: [CodeQuestion]) => {
    return new Promise(async (resolve, reject) => {
        console.log('⏰ Creating PDF...')

        const doc = new PDFDocument;
        
        doc.pipe(fs.createWriteStream('docs/output.pdf'))
        doc.font('fonts/arial.ttf').fontSize(12)

        for(let i = 0; i < codesList.length; i++){
            doc.text(codesList[i].question)
            doc.moveDown()

            doc.image(`screenshots/${i}.jpg`, {
                fit: [250, 300],
                align: 'center',
            })

            doc.moveDown()
            doc.moveDown()
        };

        doc.end()

        resolve(true);
    })
}

const insertAndRun = async (page: puppeteer.Page, text: string, index: number) => {
    return new Promise(async(resolve, reject) => {
        try {
            await page.focus('#codeInputPane > textarea')
            await page.keyboard.type(text)

            await page.click('#executeBtn')

            setTimeout(async () => {
                const lastLineButton = await page.$('#jmpLastInstr');
                
                if(lastLineButton){
                    await lastLineButton.click()
                    await page.screenshot({ path: `screenshots/${index}.jpg`})

                    resolve(true)
                }
            }, 1000)
        } catch (error) {
            console.log(error)
            reject(error)
        }

    })
}

(async () => {
    console.log('🚀 Launching process...')

    const browser = await puppeteer.launch()
    const page = await browser.newPage()

    await page.goto('http://www.pythontutor.com/visualize.html')

    await runCodes(page)

    await browser.close()

    console.log('✅ All is done!')
})()