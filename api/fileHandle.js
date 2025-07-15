const { ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require("fs");
const fsp = require('fs').promises;
const marked = require('marked');

module.exports = function(){
    // 폴더 선택 요청 수신
    ipcMain.handle('select-folder', async () => {
        const result = await dialog.showOpenDialog({
            properties: ['openDirectory']
        });
        if (result.canceled || !result.filePaths || result.filePaths.length === 0) {
            return null;
        }

        const folderPath = result.filePaths[0];
        try {
            const files = await fsp.readdir(folderPath);
            
            // .svg 파일들만 필터링
            const svgFiles = files.filter(file => path.extname(file).toLowerCase() === '.svg');
            const icons = await getIconsData(folderPath, svgFiles);

            return { path: folderPath, data: icons};
        } catch (err) {
            return { path : folderPath, data: [], error: err.message };
        }
    });

    // SVG 파일들을 배열 형식으로 변환
    async function getIconsData(folderPath, svgFiles) {
        const icons = [];
        for (const svgFile of svgFiles) {
            try {
                const svgPath = path.join(folderPath, svgFile);
                let svgData = await fsp.readFile(svgPath, 'utf8');
                const fileName = path.basename(svgFile, '.svg');
                // width, height 속성 제거
                // svgData = svgData
                //   .replace(/\swidth="[^"]*"/gi, '')
                //   .replace(/\sheight="[^"]*"/gi, '');
                
                // SVG 데이터에서 기본 정보 추출
                const viewBoxMatch = svgData.match(/viewBox="([^"]+)"/);
                let sizes = "32x32"; // 기본값
                if (viewBoxMatch) {
                    const viewBox = viewBoxMatch[1].split(' ');
                    const width = viewBox[2];
                    const height = viewBox[3];
                    sizes = `${width}x${height}`;
                }
                
                icons.push({
                    name: fileName,
                    data: svgData.trim(),
                    sizes: sizes,
                    category: [],
                    updated: new Date().toISOString().replace('T', ' ').substring(0, 19)
                });
            } catch (fileErr) {
                console.error(`Error reading SVG file ${svgFile}:`, fileErr);
            }
        }
        return icons;
    }


    // JSON 파일 선택 요청 수신
    ipcMain.handle('select-json', async () => {
        const result = await dialog.showOpenDialog({
            title: 'JSON 파일 선택',
            filters: [
                { name: 'JSON Files', extensions: ['json'] }
            ],
            properties: ['openFile']
        });
        if (result.canceled || !result.filePaths || result.filePaths.length === 0) {
            return null;
        }

        const jsonFilePath = result.filePaths[0];
        try {
            const jsonData = await fsp.readFile(jsonFilePath, 'utf8');
            const svgInfo = JSON.parse(jsonData);
            return { path: jsonFilePath, data: svgInfo };
        } catch (err) {
            return { path : jsonFilePath, data: [], error: err.message };
        }
    });


    // Markdown 파일 로드 요청 수신
    ipcMain.handle('load-md', async (_, filePath) => {
        const absPath = path.resolve(__dirname, '..', filePath)
        const mdContent = fs.readFileSync(absPath, 'utf8')
        return marked.parse(mdContent)
    })
}